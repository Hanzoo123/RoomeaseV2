# RoomEase backend plan (PHP + MySQL on WAMP64)

## Where things stand

| Part | Who uses it | Status |
| --- | --- | --- |
| React app (`src/`) | Guests, boarders, landlords | Works, but keeps its data in the browser (localStorage) |
| AdminLTE admin panel (`backend/admin/`) | Admins and super admins | **Done**: PHP + MySQL, runs on WAMP now |
| Database (`database/roomease.sql`) | Both | **Done**: schema plus demo data |
| JSON API (`backend/api/`) | React app | **Phases 1–2 done** (accounts, public listings). Landlord listings and the rest: phases 3–5 below |

The admin panel already reads and writes MySQL directly. What's missing is a PHP API so that the React app uses the same database instead of localStorage. Once that exists:
- a landlord's new listing appears in the admin review queue;
- an approval in AdminLTE shows up on Find Place to Stay;
- a deactivated account is signed out of the React app.

```
Browser
 ├── React app ──────── fetch('/api/…') ──► backend/api/   (PHP, JSON, session cookie) ─┐
 │   (Vite: localhost:5173, or built into WAMP)                                         ├──► MySQL `roomease` (WAMP)
 └── AdminLTE panel ── localhost/RoomeaseV2/backend/admin/  (PHP pages) ────────────────┘
```

---

## 1. Set up WAMP64 (you can do this now)

1. Install **WAMP64 3.3 or newer** (PHP 8.1+, MySQL 8 or MariaDB 10.6+). Start it; the tray icon turns green.
2. Put the project in WAMP's web folder:
   ```
   cd C:\wamp64\www
   git clone https://github.com/Hanzoo123/RoomeaseV2.git
   ```
3. Create the database: open http://localhost/phpmyadmin (user `root`, no password), then **Import**, choose `database/roomease.sql`, and click **Go**. It creates the `roomease` database with all tables and demo data.
   - If you imported into WAMP's **MariaDB** instead of MySQL, MariaDB uses port 3307. Change `$host` in `backend/config/database.php` to `'localhost;port=3307'` (the admin panel and the API both read it).
4. Open the admin panel at **http://localhost/RoomeaseV2/backend/admin/** and sign in.

   | Role | Username (or email) | Password |
   | --- | --- | --- |
   | Super Admin | `superadmin` (`superadmin@roomease.ph`) | `Superadmin#2026` |
   | Admin | `admin` (`admin@roomease.ph`) | `Admin#2026` |

   Landlords (`juan@`, `rosa@` and `ramon@roomease.ph`) use `Landlord#2026`, and boarders (`maria@roomease.ph` and the others) use `Boarder#2026`. These are for when the React app is connected (step 5). **Change or remove the demo accounts before real use.**
5. Open the website at http://localhost/RoomeaseV2/. WAMP serves the built copy in `dist/`.
   - While changing the React code, use `npm install` and then `npm run dev` (http://localhost:5173) instead.
   - Run `npm run build` afterwards so WAMP shows the changes.

**Check in WAMP** (left-click the tray icon, then PHP, then PHP extensions or Settings):
- `pdo_mysql`, `mbstring`, `fileinfo` and `gd` are on (they are by default).
- `upload_max_filesize = 10M` and `post_max_size = 12M`, for listing photos.
- Apache `rewrite_module` is on (needed by the API and the built React app).

### Admin vs Super Admin (already built)

| Admin panel page | Admin | Super Admin |
| --- | :---: | :---: |
| Dashboard, Listings (approve, send back with reason, remove, restore), listing review page | ✔ | ✔ |
| Boarders & Landlords (view, deactivate with reason, reactivate) | ✔ | ✔ |
| Contact Inbox, Reports (charts and Copy/CSV/Excel/PDF/Print), My Profile | ✔ | ✔ |
| User Management: view, add and edit admin accounts (role, status, temporary password) | | ✔ |
| Activity Log (every approval, removal, account change and sign-in) | | ✔ |

Built-in safeguards:
- Only admin roles can sign in to the panel, and only while active.
- Sign-in is throttled: 5 wrong tries per account, or 20 per IP address, within 15 minutes.
- Every form carries a CSRF token.
- A new admin, or one whose password was reset, must choose their own password at the next sign-in.
- A super admin can't demote or deactivate themselves, and the last active super admin can't be removed.
- Spreadsheet exports are guarded against formula injection.

---

## 2. Database

`database/roomease.sql` is the PHP version's schema (Hanzoo123/Roomease), plus what the React app needs.

| Table | Holds | Notes |
| --- | --- | --- |
| `users` | Boarders, landlords, admins, super admins | `role` is one of `super_admin`, `administrator`, `landlord`, `boarder`. Added: `middle_name`, `deactivation_reason`, `last_login_at` |
| `boarding_houses` | A listing | Added: `area`, `submitted_at`, `views`, `removal_reason`. Removing sets `deleted_at` (restorable) |
| `rooms`, `room_types` | Each room's type, rent, capacity and slots taken | Rent is per room |
| `amenities`, `utilities`, `boarding_house_amenities`, `boarding_house_utilities` | What a listing offers, and how each bill is charged | |
| `images` | Listing and room photos (paths only) | |
| `favorites`, `reservations` | Saved rooms; room requests | `reservations.status = 'accepted'` is "Approved" in the React app |
| `reviews` | Star rating, comment, landlord reply | **New** |
| `conversations`, `messages` | Boarder–landlord chat | **New** |
| `notifications` | For one user, or for a whole role (`for_role`) | **New**. The admin panel already writes these on approve, reject, remove and restore |
| `contact_messages` | Contact Us form | **New**. Shown in the AdminLTE Contact Inbox |
| `password_resets`, `remember_tokens`, `login_attempts` | Reset codes, "Remember me", throttling | Only hashes are stored |
| `audit_logs`, `site_settings` | Activity log; settings | |

**How the React data maps to the tables:**

| React field | MySQL |
| --- | --- |
| `listing.price` | `MIN(rooms.monthly_rent)` |
| `listing.roomType` | The room types of its rooms |
| `totalRooms` / `availableRooms` / `availableSlots` | `COUNT(rooms)` / rooms with a free slot / `SUM(capacity - slots_taken)` of open rooms |
| `approval` (Pending / Approved / Rejected) | `moderation_status` (pending / approved / rejected) |
| `removed` | `deleted_at IS NOT NULL` |
| `houseRules[]` | `house_rules`, one rule per line |
| `paymentMethods[]` | `payment_methods`, comma-separated |
| `utilities[{name, billing}]` | `boarding_house_utilities.billing_policy` |

The compare list and recently viewed rooms stay in the browser; they don't need tables.

---

## 3. The API

**Folder** (✅ = built in phase 1):
```
backend/
  config/
    database.php         ✅ MySQL settings, shared with the admin panel
    app.php              ✅ site settings (a reset code that can't be emailed is shown to this computer only)
  lib/validation.php     ✅ password, phone and email rules, shared with the admin panel
  lib/env.php            ✅ reads .env (project root): Gmail App Password, optional database settings
  lib/runtime.php        ✅ production mode (ROOMEASE_ENV), error logging to logs/php-errors.log
  lib/mailer.php         ✅ sends email through Gmail (TLS on 465, or STARTTLS on 587); logs to logs/mail.log
  tools/                 ✅ command line only (.htaccess: never served):
    send-test-email.php      checks the Gmail settings
    go-live-check.php        what's left before going live, and how to fix it
    create-super-admin.php   your own super admin, with a one-time password
    remove-demo-data.php     the demo accounts and everything of theirs (backs up first)
    backup-database.php      the database and photos into backups/, keeping the newest 30
  logs/                  ✅ mail.log, php-errors.log; .htaccess: never served
  backups/               ✅ roomease-<date>.sql and -uploads.zip; .htaccess: never served
  admin/                 ✅ AdminLTE panel
  api/
    index.php            ✅ router: the $routes list maps "METHOD /path" to a function
    .htaccess            ✅ sends every api/… address to index.php; lib/ and routes/ can't be opened
    lib/
      http.php           ✅ ok(), fail(), body(), input()
      db.php             ✅ connection (JSON error if MySQL is down), audit()
      auth.php           ✅ session, CSRF, current_user(), require_user(), "Remember me"
      throttle.php       ✅ limits on sign-in, sign-up and reset tries (login_attempts)
      images.php         ✅ photo checks and GD re-drawing, shared by avatars and listing photos
    routes/
      auth.php           ✅ me, register, login, logout, forgot, verify-code, reset
      me.php             ✅ profile, avatar, password
      listings.php       ✅ lookups, browse (filters, sort, pages), one listing with rooms, views, reviews
      landlord.php       ✅ a landlord's own listings: add, edit, resubmit, delete, room availability;
                            answering requests; replying to reviews
      boarder.php        ✅ saved listings, requesting a room, cancelling, writing reviews
      messages.php       ✅ conversations and messages, notifications, the Contact form
  uploads/               ✅ avatars/ and listings/. .htaccess: no scripts run here
```

**Adding an endpoint:** write a `route_…()` function in a file under `routes/`, require that file in `index.php`, and add `'METHOD /path/{id}' => 'route_…'` to `$routes`. Inside it:
- `require_user()` (or `require_user('landlord')`) for who may call it;
- `input('field')` and `body()` to read the request;
- `db()` for queries (always prepared statements);
- `ok($data)` or `fail(422, 'Message', $fields)` to answer;
- `audit(…)` for the Activity Log.

The CSRF check runs on every non-GET request before your function.

**Conventions:**
- Requests and responses are JSON. A success is `{ "ok": true, "data": … }`. An error is `{ "ok": false, "error": "Message to show" }`, with the right HTTP status (400, 401, 403, 404, 422 or 429).
- Database columns are snake_case; the API returns camelCase, so React components keep their field names.
- Dates are ISO 8601. Money is whole pesos.
- **Sessions:** PHP session cookie `ROOMEASE_API` (HttpOnly, SameSite=Lax), separate from the admin panel's `ROOMEASE_ADMIN`.
- **CSRF:** `GET /api/auth/me` returns a token, and the React client sends it as an `X-CSRF-Token` header on every POST, PUT, PATCH and DELETE. An expired token answers 403 with `"code": "csrf"`; `src/api/client.js` then fetches a new one and retries once.
- **Same origin, so no CORS:**
  - In development, Vite forwards `/backend/…` to WAMP (`ROOMEASE_WAMP_URL`, default `http://localhost/RoomeaseV2/`).
  - On WAMP, the built React app and the API are served by the same Apache.
- **Signed-out detection:** every request re-reads the account, so a deactivated account, or one whose password was changed or reset elsewhere, is signed out at once. The website asks `GET /auth/me` when the tab regains focus and every minute, and says why it signed someone out.

### Endpoints

**Accounts**

| Method and path | Who | Does |
| --- | --- | --- |
| `POST /auth/register` | Guest | Boarder or landlord sign-up, with the password rules and PH mobile number check |
| `POST /auth/login` | Guest | Email, password, role and "remember me". Throttled with `login_attempts` |
| `POST /auth/logout` | Signed in | Ends the session and deletes the remember-me token |
| `GET /auth/me` | Anyone | Current user (or null) and the CSRF token |
| `POST /auth/forgot` | Guest | Creates a `password_resets` row with a 6-digit code (only its hash is stored). Answers the same whether or not the email has an account. The code is emailed through Gmail (`backend/lib/mailer.php`). If it can't be (Gmail isn't set up in `.env`, or sending failed), the code and the reason come back in the answer, but only for requests from the WAMP computer itself, and only while `ROOMEASE_SHOW_RESET_CODES` isn't `false` |
| `POST /auth/verify-code` | Guest | Code check: 10 minutes, 5 tries |
| `POST /auth/reset` | Guest | New password, after the code was verified |
| ✅ `GET /auth/google/start?role&remember&next&return` | Guest | "Continue with Google": sends the browser to Google with a single-use `state` and PKCE (`backend/api/routes/google.php`). `return` (the website's address) must be on this same host |
| ✅ `GET /auth/google/callback` | Guest | Google sends the browser back here. The code is exchanged over checked HTTPS; the ID token's issuer, audience, expiry and verified email are checked. A known account (by Google id, or by email, which links it and retires its old password) is signed in; admins, removed and deactivated accounts are refused. Ends on the website's `/auth/google` (or `/login?googleError=…`) |
| ✅ `GET /auth/google/pending`, `POST /auth/google/finish` | Guest | Someone new to RoomEase: shows their Google name and email, then creates the account with the role and mobile number they give |
| `PATCH /me`, `POST /me/avatar`, `DELETE /me/avatar`, `POST /me/password` | Signed in | Profile, photo (re-drawn as a 256 × 256 JPEG with GD), password (other devices are signed out) |
| ✅ `PATCH /me/preferences` | Signed in | Settings > Notifications: `{ emailUpdates?, reservationAlerts?, listingTips? }`, saved in `user_preferences` (created by itself in a database imported before it existed). The user from `/auth/me` carries them as `preferences` |

**Public: Find Place to Stay**

| Method and path | Does |
| --- | --- |
| ✅ `GET /lookups` | Room types, amenities, utilities, areas, payment methods (for the filters and forms) |
| ✅ `GET /listings?q&area&min&max&roomType&amenities&available&stay&sort&page&perPage` | Approved and not removed only. Each listing has its rent range (`rent.min`/`rent.max`), room types (most common first), room counts and free slots, amenities, bills, house rules, stay terms, map pin, photos, rating and landlord name and number. `min`/`max` compare the cheapest room; a room-type filter matches any of a house's rooms. `sort`: `recommended`, `newest`, `price-asc`, `price-desc`, `rating`. Distance filters stay in the browser |
| ✅ `GET /listings/{id}` | The same, plus each room: name, type, rent, capacity, slots taken, free slots, photos. A pending, rejected or removed listing answers 404 |
| ✅ `POST /listings/{id}/view` | Counts a room-page visit, once per listing per session |
| ✅ `GET /listings/{id}/reviews` | Reviews with landlord replies, the rating, `mine` on the signed-in boarder's review and `canReview` (an approved stay). The landlord can also read their own listing's reviews while it isn't public |
| ✅ `GET /reviews/highlights` | The review count and average across live listings, and the three newest five-star reviews (home page) |

**Boarders**

| Method and path | Does |
| --- | --- |
| ✅ `GET /favorites`, `PUT /favorites/{listingId}`, `DELETE /favorites/{listingId}` | Saved listings (MySQL ids, newest first). Only live listings can be saved |
| ✅ `GET /reservations` | The boarder's requests, newest first, each with its room, boarding house, landlord (name and number) and status: `pending`, `accepted`, `declined` (with the landlord's reason) or `cancelled` |
| ✅ `POST /reservations` | `{ roomId, moveIn, message? }`. The room must be in a live listing and have a free bed; the move-in date today to a year ahead. One waiting request per boarding house, and at most 5 waiting at a time. The landlord gets a notification |
| ✅ `POST /reservations/{id}/cancel` | Only while it's still waiting. The landlord gets a notification |
| ✅ `POST /listings/{id}/reviews` | `{ rating, comment }`, only after an approved stay. One review per boarder per boarding house: posting again edits it |
| ✅ `DELETE /reviews/{id}` | The boarder's own review |

**Landlords** (only for their own listings)

| Method and path | Does |
| --- | --- |
| ✅ `GET /landlord/listings` | The landlord's listings, newest first, in the public shape plus `status` (`pending`, `approved`, `rejected`), `rejectionReason`, `removed` and `removalReason` (when an admin removed it), every room (with `activeRequests`), and `photoIds`. Listings the landlord deleted are left out |
| ✅ `POST /landlord/listings` | A new listing, `pending` with `submitted_at = NOW()`, so it shows under AdminLTE > Listings > In review. The body holds the whole form: details, stay terms, amenities, bills, house rules, map pin, `rooms` and `photos` |
| ✅ `PUT /landlord/listings/{id}` | Saves the whole form. A `rejected` listing goes back to `pending` (reason cleared, `submitted_at = NOW()`) and answers `resubmitted: true`; a live one stays live. A listing an admin removed answers 409 |
| ✅ `DELETE /landlord/listings/{id}` | Hides it (`deleted_at`, `deleted_by` = the landlord, kept for the admins under Removed) and declines its requests that were still waiting |
| ✅ `PATCH /landlord/rooms/{id}` | `{ slotsTaken?, isOpen? }` from Room Availability |
| ✅ `GET /landlord/reservations` | Requests for the landlord's rooms, newest first, with the boarder's name, email and phone |
| ✅ `POST /landlord/reservations/{id}/decide` | `{ decision: "accept" \| "decline", note? }`. Accepting takes a bed in that room (refused with 409 if it's full); declining can give a reason the boarder sees. A request that was already answered or cancelled answers 409. The boarder gets a notification |
| ✅ `POST /landlord/reviews/{id}/reply` | `{ text }`; an empty text removes the reply |

How a listing save works (`routes/landlord.php`):
- **Rooms** are sent as the full list: `{ id?, name, type, rent, capacity, slotsTaken, isOpen }`. Rooms with an id are updated, new ones added, missing ones deleted. A room with pending or accepted requests can't be deleted (its requests would go with it), so the landlord closes it instead. Names must differ within a listing.
- **Photos** are sent in order, up to 5: `{ id }` keeps a saved photo, `{ data: "data:image/jpeg;base64,…" }` adds one. The first is the cover. New photos are checked, re-drawn with GD to at most 1600 px and saved as `uploads/listings/<random>.jpg`; dropped ones are deleted. A save can be up to 7 MB (the app shrinks photos to about 1024 px first).
- Everything is one transaction: if anything fails, nothing changes and new photo files are removed.
- Errors answer 422 with a message per field, e.g. `{ "name": "…", "rooms.1.rent": "…" }`, which the form shows next to each field.
- Audit log: `listing.submitted`, `listing.resubmitted`, `listing.updated`, `listing.deleted`.

Analytics need no endpoint of their own: the charts are worked out in the browser from `GET /landlord/listings` (views, rooms, ratings) and `GET /landlord/reservations`.

Notifications for requests, answers, cancellations and new reviews are written to the `notifications` table (as the admin panel does for listing decisions), and the website shows them. Reservation notifications follow the person's "Reservation updates" setting.

**Decision emails** (`backend/lib/emails.php`, through Gmail): landlords when an admin approves, sends back, removes or restores their listing (admin panel); boarders when a landlord approves or declines their request, or deletes the listing (API). Only to active accounts with "Email updates" on (and, for boarders, "Reservation updates" on). Sent after the decision is saved, so a failed email never undoes it; `mail.log` records it. Links use `ROOMEASE_SITE_URL` from `.env`, else the address of the request.

**Everyone signed in**

| Method and path | Does |
| --- | --- |
| ✅ `GET /conversations` | The signed-in person's chats, newest activity first, each with its boarding house, both people, the last message and how many are unread |
| ✅ `POST /conversations` | `{ listingId, boarderId? }`: opens the chat about a boarding house, starting it if needed. A boarder starts one about a live listing; a landlord, with a boarder who asked for a room in one of their listings |
| ✅ `GET /conversations/{id}/messages?after=…` | Messages, oldest first; with `after` (a message id), only newer ones. The open chat asks every 5 seconds (WAMP has no WebSockets) |
| ✅ `POST /conversations/{id}/messages` | `{ body }`, up to 2,000 characters; at most 20 a minute per person. Sending also marks the chat read |
| ✅ `POST /conversations/{id}/read` | Marks the chat read (`boarder_last_read` / `landlord_last_read`), which clears its unread count |
| ✅ `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`, `DELETE /notifications/{id}` | The newest 100 and the unread count. Each change answers with the new list. Links are app pages (`/landlord/reservations`, `/landlord/listings/12`) |

**Anyone**

| Method and path | Does |
| --- | --- |
| ✅ `POST /contact` | `{ name, email, topic, message, website }`. Saved in `contact_messages`, so it shows in the AdminLTE inbox as New. `website` is a hidden field: a bot that fills it gets a normal answer and nothing is saved. Each email can send 3 an hour and each IP address 10 (`login_attempts`, kind `contact`) |

Admins need no API endpoints: the AdminLTE panel talks to MySQL itself.

---

## 4. Security checklist (API)

- [x] `password_hash()` / `password_verify()`, with the same password rules on the server as in the browser (`backend/lib/validation.php`, shared with the admin panel)
- [x] PDO prepared statements everywhere; never put user input into SQL text (the few SQL pieces built in code, such as a status filter or sort order, come from fixed lists)
- [x] `session_regenerate_id(true)` on sign-in. On every request, reject users who are deactivated (`is_active = 0`) or removed (`deleted_at`)
- [x] Role and ownership checks in each route. For example, a landlord can only change their own listings, and a boarder can only cancel their own request
- [x] CSRF header on every write request
- [x] Throttling: sign-in, password reset and contact form, using `login_attempts`
- [x] Uploads:
  - the browser refuses files over 10 MB and shrinks photos; the API accepts up to 3 MB per listing photo and 1.5 MB per profile photo
  - check the real type with `finfo` (JPEG, PNG or WebP)
  - re-encode with GD, which strips hidden data
  - give each file a random name
  - save to `backend/uploads/`, with an `.htaccess` there that blocks PHP
- [x] Reset codes and remember-me tokens stored only as hashes (`password_hash` for codes, SHA-256 for tokens)
- [x] Secrets (the Gmail App Password, optionally the database password) in `.env`, which git ignores and Apache refuses to serve; mail.log never holds a code or a password
- [x] `display_errors = Off` when you present or deploy; log errors to a file instead (`ROOMEASE_ENV=production` in `.env`; always logged to `backend/logs/php-errors.log`; the admin panel shows a plain message instead of database details)
- [x] Session cookies `HttpOnly` and `SameSite=Lax`, and `Secure` on HTTPS
- [x] No folder listings, and `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy` headers (root `.htaccess`)
- [x] Write `audit_logs` entries for landlord listing actions (submitted, resubmitted, updated, deleted), so the super admin's Activity Log stays complete
- [x] The same for reservation decisions and cancellations (`reservation.accepted`, `reservation.declined`, `reservation.cancelled`)

---

## 5. Connecting the React app

1. ✅ `src/api/client.js`: a small `fetch` wrapper. It sends the CSRF header, reads `{ ok, data, error }`, and turns failures (WAMP off, a PHP error page) into messages the pages can show.
2. ✅ `vite.config.js` forwards `/backend/…` to WAMP during `npm run dev`. The API lives at `` `${BASE_PATH}backend/api` `` (`src/config/api.js`), so the WAMP build works from any folder.
3. ✅ `AuthContext` now picks `ApiAuthProvider` (the API) or the in-browser demo provider (`VITE_USE_API=false`). Both have the same functions, now async: `login`, `register`, `logout`, `updateProfile`, `changePassword`, `requestPasswordReset`… The pages `await` them.
   - **App ids** (`src/api/ids.js`): the demo accounts keep their demo ids such as `u-boarder-1` after signing in through the API, and new accounts get `db-<user_id>`. The API is always called with the MySQL id.
4. ✅ (phase 2) `DataContext` takes the public listings from `GET /listings` (`src/api/listings.js` turns them into the shape the pages already use). It reloads them when the tab regains focus and every minute, so an approval in the admin panel shows up. The room page loads each room from `GET /listings/{id}`. Pages show placeholders while loading, and a "couldn't be loaded / Try again" card if WAMP is off.
   - **App ids:** a demo landlord's own demo listing keeps its demo id and illustration (`/rooms/sunrise`), and other listings get `db-<id>` (e.g. `/rooms/db-11`). What stays in the browser per person (the compare list, recently viewed rooms) uses these ids.
5. ✅ (phase 3) A landlord's own listings come from `GET /landlord/listings` (`src/api/landlord.js`), with the same reload rhythm. Add, edit, resubmit and delete call the API and wait for it; the form shows the API's field errors. The listing form has a **Rooms** section (`RoomsEditor`): each room with its own name, type, rent, beds and beds taken. Room Availability changes each room's beds taken and open/closed (`PATCH /landlord/rooms/{id}`), showing the change at once. The landlord's listing page shows the rooms, and opens from a MySQL id too (`/landlord/listings/12`, as in the admin panel's notifications).
   - In demo mode the demo listings get rooms made up from their totals (`src/data/rooms.js`), and saving works the totals out from the rooms, so both modes use the same form.
6. ✅ (phase 4) Reservations, saved listings and reviews come from the API (`src/api/reservations.js`, `src/api/reviews.js`). Every list from the API loads through one hook, `usePolled`: at first, when the tab regains focus and every minute, so a request sent in one browser shows up for the landlord in another, and the answer comes back the same way.
   - The reservation form has a **room picker** (rooms with a free bed, with their type, rent and free beds), and the request is for that room. The landlord sees the room, the boarder's phone and email, and their message; approving takes a bed in that room.
   - Reviews load per listing (`useListingReviews`); ratings on cards come with each listing. The home page's review numbers and quotes come from `GET /reviews/highlights`.
   - Writes wait for the API and show its message if it says no (e.g. the room filled up, or the boarder cancelled while the landlord was deciding). The heart on a listing changes at once and is put back if saving fails.
7. ✅ (phase 5) Messages, notifications and the Contact form use the API (`src/api/messages.js`). The chat list and unread badges reload every 20 seconds and notifications every 30 (and when the tab regains focus); an open chat (`useChat`) asks for newer messages every 5 seconds, so a reply shows up without reloading. Starting a chat from a room page or a reservation request waits for the API, then opens it. With the API, nothing the website shows comes from the browser's demo data any more; Settings → *Reset demo data* is shown only in demo mode.
8. Remove the mock seed data (`src/data/mockData.js`) once everything comes from MySQL.

---

## 6. Build order

Each phase ends with something you can show.

| Phase | Build | Done when |
| --- | --- | --- |
| **0** ✅ | Database and the AdminLTE admin / super admin panel | You can sign in as `superadmin` and approve or reject the demo listings |
| **1** ✅ | API skeleton (router, JSON helpers, session, CSRF) and the Accounts endpoints; React `AuthContext` on the API | A boarder who signs up in React appears under Boarders & Landlords. Deactivating them in AdminLTE signs them out of React |
| **2** ✅ | Public listing endpoints; React browse and room pages from MySQL | Approving a listing in AdminLTE makes it appear on Find Place to Stay |
| **3** ✅ | Landlord listings, rooms, photos and availability; resubmitting | A landlord's new listing appears in the AdminLTE review queue. Sending it back shows the reason in React |
| **4** ✅ | Reservations, favorites, reviews, landlord replies, analytics | The full reservation flow works between two browsers |
| **5** ✅ | Messages, notifications (polling), Contact form | A Contact Us message appears in the AdminLTE inbox |
| **6** ✅ | Real email for reset codes through Gmail with an App Password (a small SMTP client, as in the first RoomEase project, so no Composer is needed); "Remember me" tokens (done in phase 1) | A reset code arrives by email |
| **7** ✅ | The website served by WAMP: a relative build in `dist/`, plus `index.php` and `.htaccess`, so it works from any folder name. Going live: production mode (errors hidden and logged), your own super admin, the demo data removed, daily backups, and a check that says what's left (`backend/tools/`, README.md "Going live") | The whole system runs from `http://localhost/RoomeaseV2/` with Vite stopped |

**Test checklist for every phase:**
- [ ] Signed out: protected endpoints return 401
- [ ] Wrong role or not the owner: 403
- [ ] Bad input: 422 with a message the form can show
- [ ] Admin panel pages still load (shared tables changed?)
- [ ] `php -l` on every changed file; the React build and lint pass

---

## 7. Decisions to make

- **Email:** ✅ Gmail SMTP with an App Password (`.env`: `ROOMEASE_MAIL_USERNAME`, `ROOMEASE_MAIL_PASSWORD`, `ROOMEASE_MAIL_PORT`). `php backend/tools/send-test-email.php you@example.com` checks the settings. Without them, the code is shown on screen to the WAMP computer only.
- **Room-level reservations:** ✅ decided: boarders pick the room in the reservation form, and the request is for that room.
- **Hosting:** WAMP is fine for the defense and demos. A real public site would need a host with PHP 8 and MySQL, plus HTTPS.
