# RoomEase backend plan (PHP + MySQL on WAMP64)

## Where things stand

| Part | Who uses it | Status |
| --- | --- | --- |
| React app (`src/`) | Guests, boarders, landlords | Works, but keeps its data in the browser (localStorage) |
| AdminLTE admin panel (`backend/admin/`) | Admins and super admins | **Done**: PHP + MySQL, runs on WAMP now |
| Database (`database/roomease.sql`) | Both | **Done**: schema plus demo data |
| JSON API (`backend/api/`) | React app | **To build**: this plan |

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
   - If you imported into WAMP's **MariaDB** instead of MySQL, MariaDB uses port 3307. Change `$host` in `backend/admin/config/conn.php` to `'localhost;port=3307'`.
4. Open the admin panel at **http://localhost/RoomeaseV2/backend/admin/** and sign in.

   | Role | Username (or email) | Password |
   | --- | --- | --- |
   | Super Admin | `superadmin` (`superadmin@roomease.ph`) | `Superadmin#2026` |
   | Admin | `admin` (`admin@roomease.ph`) | `Admin#2026` |

   Landlords (`juan@`, `rosa@` and `ramon@roomease.ph`) use `Landlord#2026`, and boarders (`maria@roomease.ph` and the others) use `Boarder#2026`. These are for when the React app is connected (step 5). **Change or remove the demo accounts before real use.**
5. Run the React app: `npm install`, then `npm run dev`, then open http://localhost:5173. If your folder isn't `RoomeaseV2`, copy `.env.example` to `.env.local` and fix `VITE_ADMIN_URL`.

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

**Folder:**
```
backend/
  admin/                 AdminLTE panel (done)
  api/
    index.php            router: matches METHOD + path, calls a handler
    .htaccess            sends every /api/* request to index.php
    lib/
      db.php             requires ../admin/config/conn.php (one place for the credentials)
      http.php           json_ok(), json_error(), read_json_body()
      auth.php           session start, current_user(), require_role(), CSRF check
      validate.php       same rules as src/data/validation.js
      upload.php         photo checks and resizing
    routes/              auth.php, listings.php, landlord.php, reservations.php, reviews.php,
                         favorites.php, messages.php, notifications.php, contact.php, me.php
  uploads/               listing photos and avatars (.htaccess: no PHP runs here)
```

**Conventions:**
- Requests and responses are JSON. A success is `{ "ok": true, "data": … }`. An error is `{ "ok": false, "error": "Message to show" }`, with the right HTTP status (400, 401, 403, 404, 422 or 429).
- Database columns are snake_case; the API returns camelCase, so React components keep their field names.
- Dates are ISO 8601. Money is whole pesos.
- **Sessions:** PHP session cookie `ROOMEASE_API` (HttpOnly, SameSite=Lax), separate from the admin panel's `ROOMEASE_ADMIN`.
- **CSRF:** `GET /api/auth/me` returns a token, and the React client sends it as an `X-CSRF-Token` header on every POST, PUT, PATCH and DELETE.
- **Same origin, so no CORS:**
  - In development, Vite proxies `/api` to `http://localhost/RoomeaseV2/backend/api`.
  - In production, the built React app is served by the same Apache.

### Endpoints

**Accounts**

| Method and path | Who | Does |
| --- | --- | --- |
| `POST /auth/register` | Guest | Boarder or landlord sign-up, with the password rules and PH mobile number check |
| `POST /auth/login` | Guest | Email, password, role and "remember me". Throttled with `login_attempts` |
| `POST /auth/logout` | Signed in | Ends the session and deletes the remember-me token |
| `GET /auth/me` | Anyone | Current user (or null) and the CSRF token |
| `POST /auth/forgot` | Guest | Creates a `password_resets` row and emails a 6-digit code. Always answers "sent" |
| `POST /auth/verify-code` | Guest | Code check: 10 minutes, 5 tries |
| `POST /auth/reset` | Guest | New password, after the code was verified |
| `PATCH /me`, `POST /me/avatar`, `POST /me/password` | Signed in | Profile, photo, password |

**Public: Find Place to Stay**

| Method and path | Does |
| --- | --- |
| `GET /lookups` | Room types, amenities, utilities and areas (for the filters and forms) |
| `GET /listings?q&area&min&max&roomType&amenities&available&stay&sort&page` | Approved and not removed only. Distance filters stay in the browser |
| `GET /listings/{id}` | Details with rooms, photos, amenities, bills, stay terms, rating and landlord contact |
| `POST /listings/{id}/view` | Counts a view (once per session) |
| `GET /listings/{id}/reviews` | Reviews with landlord replies |

**Boarders**

| Method and path | Does |
| --- | --- |
| `GET /favorites`, `PUT /favorites/{listingId}`, `DELETE /favorites/{listingId}` | Saved rooms |
| `GET /reservations`, `POST /reservations`, `POST /reservations/{id}/cancel` | Requests use a `roomId` and a move-in date |
| `POST /listings/{id}/reviews`, `PATCH /reviews/{id}`, `DELETE /reviews/{id}` | Only after an accepted stay |

**Landlords** (only for their own listings)

| Method and path | Does |
| --- | --- |
| `GET /landlord/listings`, `POST /landlord/listings`, `PUT /landlord/listings/{id}`, `DELETE /landlord/listings/{id}` | A new listing is `pending`. Saving a `rejected` one resubmits it (status back to `pending`, `submitted_at = NOW()`) |
| `POST /landlord/listings/{id}/rooms`, `PUT /landlord/rooms/{id}`, `DELETE /landlord/rooms/{id}`, `PATCH /landlord/rooms/{id}/slots` | Several rooms with their own rent (the PHP feature still missing from React) |
| `POST /landlord/listings/{id}/photos`, `DELETE /landlord/photos/{id}`, `POST /landlord/photos/{id}/cover` | Up to 5 photos |
| `GET /landlord/reservations`, `POST /landlord/reservations/{id}/decide` | Accept, or decline with a reason. Accepting takes a slot |
| `POST /landlord/reviews/{id}/reply` | Reply to a review |
| `GET /landlord/analytics` | The numbers behind the Analytics charts |

**Everyone signed in**

| Method and path | Does |
| --- | --- |
| `GET /conversations`, `POST /conversations` | Chats, or start one about a listing |
| `GET /conversations/{id}/messages?after=…`, `POST /conversations/{id}/messages`, `POST /conversations/{id}/read` | Messages. React polls every 10 seconds (WAMP has no WebSockets) |
| `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`, `DELETE /notifications/{id}` | Notifications |
| `POST /contact` | Contact form, with a honeypot and a limit of 3 an hour per email or IP. Goes to the AdminLTE inbox |

Admins need no API endpoints: the AdminLTE panel talks to MySQL itself.

---

## 4. Security checklist (API)

- [ ] `password_hash()` / `password_verify()`, with the same password rules on the server as in the browser
- [ ] PDO prepared statements everywhere; never put user input into SQL text
- [ ] `session_regenerate_id(true)` on sign-in. On every request, reject users who are deactivated (`is_active = 0`) or removed (`deleted_at`)
- [ ] Role and ownership checks in each route. For example, a landlord can only change their own listings, and a boarder can only cancel their own request
- [ ] CSRF header on every write request
- [ ] Throttling: sign-in, password reset and contact form, using `login_attempts`
- [ ] Uploads:
  - 10 MB maximum
  - check the real type with `finfo` (JPEG, PNG or WebP)
  - re-encode with GD, which strips hidden data
  - give each file a random name
  - save to `backend/uploads/`, with an `.htaccess` there that blocks PHP
- [ ] Reset codes and remember-me tokens stored only as hashes (the tables are ready)
- [ ] `display_errors = Off` when you present or deploy; log errors to a file instead
- [ ] Write `audit_logs` entries for landlord actions too (submitted, resubmitted, decided), so the super admin's Activity Log stays complete

---

## 5. Connecting the React app

1. Add `src/api/client.js`: a small `fetch` wrapper. It sends the CSRF header, reads `{ ok, data, error }`, and turns errors into toasts.
2. Add the Vite proxy in `vite.config.js`: `server.proxy['/api'] = 'http://localhost/RoomeaseV2/backend'`.
3. Replace the inside of `AuthContext` with API calls, keeping the same function names (`login`, `register`, `logout`, `updateProfile`, `changePassword`, `requestPasswordReset`…). The pages then don't change.
4. Do the same in `DataContext`, one feature at a time. Load lists from the API and refetch after a change. A `VITE_USE_API` switch lets the mock and the API live side by side while you migrate.
5. Add a **Rooms** section to the landlord's listing form (several rooms, each with its own type and rent), and let boarders pick a room when they reserve.
6. Remove the mock seed data (`src/data/mockData.js`) once everything comes from MySQL.

---

## 6. Build order

Each phase ends with something you can show.

| Phase | Build | Done when |
| --- | --- | --- |
| **0** ✅ | Database and the AdminLTE admin / super admin panel | You can sign in as `superadmin` and approve or reject the demo listings |
| **1** | API skeleton (router, JSON helpers, session, CSRF) and the Accounts endpoints; React `AuthContext` on the API | A boarder who signs up in React appears under Boarders & Landlords. Deactivating them in AdminLTE signs them out of React |
| **2** | Public listing endpoints; React browse and room pages from MySQL | Approving a listing in AdminLTE makes it appear on Find Place to Stay |
| **3** | Landlord listings, rooms, photos and availability; resubmitting | A landlord's new listing appears in the AdminLTE review queue. Sending it back shows the reason in React |
| **4** | Reservations, favorites, reviews, landlord replies, analytics | The full reservation flow works between two browsers |
| **5** | Messages, notifications (polling), Contact form | A Contact Us message appears in the AdminLTE inbox |
| **6** | Real email for reset codes, e.g. PHPMailer with a Gmail app password; "Remember me" tokens | A reset code arrives by email |
| **7** | Production on WAMP: `npm run build` with `base: '/RoomeaseV2/'`, an `.htaccess` that serves `index.html` for app routes, errors off, demo accounts replaced, a `mysqldump` backup | The whole system runs from `http://localhost/RoomeaseV2/` with Vite stopped |

**Test checklist for every phase:**
- [ ] Signed out: protected endpoints return 401
- [ ] Wrong role or not the owner: 403
- [ ] Bad input: 422 with a message the form can show
- [ ] Admin panel pages still load (shared tables changed?)
- [ ] `php -l` on every changed file; the React build and lint pass

---

## 7. Decisions to make

- **Email:** Gmail SMTP with an app password is the simplest for a school project. Without it, the reset flow can show the code on screen in development only, as the React demo does now.
- **Room-level reservations:** the React app reserves "a listing"; the database reserves a room. Phase 3 adds a room picker. Until then, the API can pick the first room with a free slot.
- **Hosting:** WAMP is fine for the defense and demos. A real public site would need a host with PHP 8 and MySQL, plus HTTPS.
