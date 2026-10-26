# RoomEase

Find and manage boarding houses in Baybay City. Two parts:

- **The website** (React + Bootstrap 5): a public site where anyone can **Find a Place to Stay** without an account, sign-in and sign-up with password reset, and full dashboards for **boarders** and **landlords**. Boarders can browse, use "near me", the map and compare, reserve, review and chat. Landlords manage listings with house rules and bills, availability, requests and analytics, and can chat too. Light and dark mode.
- **The admin panel** (AdminLTE 3 + PHP + MySQL, for WAMP64) for **admins** and **super admins**: listing review, boarders and landlords, reports with exports, contact inbox, and for super admins, admin accounts and the activity log.

It follows the PHP version of RoomEase ([Hanzoo123/Roomease](https://github.com/Hanzoo123/Roomease)): same room types, the same public menu (Home · Find Place to Stay · About Us · Contact Us), the same listing review states and the same password rules.

| Landing page | Find Place to Stay (no account needed) | Boarder dashboard |
| --- | --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Find Place to Stay](docs/screenshots/find-place.png) | ![Boarder dashboard](docs/screenshots/boarder-dashboard.png) |
| **Browse on the map** | **Landlord dashboard** | **Analytics** |
| ![Map view](docs/screenshots/browse-map.png) | ![Landlord dashboard](docs/screenshots/landlord-dashboard.png) | ![Analytics](docs/screenshots/analytics.png) |
| **Admin panel (AdminLTE)** | **AdminLTE listing review** | **Dark mode** |
| ![Admin dashboard](docs/screenshots/admin-dashboard.png) | ![Admin listing review](docs/screenshots/admin-review.png) | ![Dark mode](docs/screenshots/landlord-dashboard-dark.png) |

## Run it

### The website (React)

```bash
npm install
npm run dev
```

Open http://localhost:5173. Sign in with a demo account (or click **Use** on the login page):

| Role | Email | Password |
| --- | --- | --- |
| Boarder | `maria@roomease.ph` | `boarder123` |
| Landlord | `juan@roomease.ph` | `landlord123` |

More landlords for testing: `rosa@roomease.ph` and `ramon@roomease.ph` (password `landlord123`). Rosa has a listing that was sent back for changes; Ramon has one waiting for review.

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`, `npm run lint`.

### The admin panel (AdminLTE on WAMP64)

1. Clone this repository into `C:\wamp64\www` (so the folder is `C:\wamp64\www\RoomeaseV2`) and start WAMP.
2. In phpMyAdmin (http://localhost/phpmyadmin, user `root`, no password), click **Import**, choose `database/roomease.sql`, and click **Go**.
3. Open http://localhost/RoomeaseV2/backend/admin/ and sign in:

| Role | Username (or email) | Password |
| --- | --- | --- |
| Super Admin | `superadmin` (`superadmin@roomease.ph`) | `Superadmin#2026` |
| Admin | `admin` (`admin@roomease.ph`) | `Admin#2026` |

The website's sign-in page links to the admin panel ("Admin or super admin?"), and `/admin` redirects there. If the project is in another folder, set `VITE_ADMIN_URL` in `.env.local` (see `.env.example`).

The admin panel already uses MySQL. The website still keeps its data in the browser until the PHP API is built. **[BACKEND_PLAN.md](BACKEND_PLAN.md)** has the steps for connecting the two, plus the WAMP setup details.

## Features

**Everyone (no account needed)**
- Public site with the PHP version's menu: **Home · Find Place to Stay · About Us · Contact Us**, plus Privacy Policy and Terms & Conditions
- **Find Place to Stay**: the full browse page, room pages, map and compare, open to guests. Saving, reserving, reviewing or messaging asks them to sign in, then brings them back to the same room
- Landing page with search, "lowest rent with a free slot", **room type tiles** (Single Room, Private Room, Double Sharing, Bed Spacer, Dormitory), top-rated rooms, areas, FAQ
- **Contact form** that goes to the admin's inbox (with a bot trap and a limit of 3 messages an hour per email)
- **Forgot password** with a 6-digit code (valid 10 minutes, 5 tries); the demo shows the code on screen because there is no email service
- Password checklist on sign-up, settings and reset (8+ characters, upper and lower case, a number, a symbol), and Philippine mobile number checks
- Light / dark mode, remembered per browser; toasts, page fade-ins and loading placeholders

**Boarders**
- Browse with filters (area, rent, room type, amenities, availability, **who can stay**) and sorting, in a **grid or on a map** with price pins
- **Near me**: uses the browser's location (kept on the device) to sort by distance, with a **within 500 m / 1 / 2 / 5 km** filter measured from VSU, the town center or you
- Room details with a **photo carousel**, **Living here** (curfew, minimum stay, visitors, cooking, pets, payment), **What's included** (bills), **House rules**, **Worth asking the landlord** (one tap sends the question as a message), **Copy number**, **Copy link**, and a location map with **Show my location** and **Get directions**
- See the landlord's reason when a request is declined
- **Ratings & reviews**: only boarders with an approved stay can review; edit or delete your own
- **Compare** up to 3 rooms side by side, with the best value in each row highlighted
- **Messages** with landlords, reservation requests, favorites, recently viewed, notifications

**Landlords**
- Dashboard with stats and **charts** (requests per month, request status); full **Analytics** page with occupancy, approval rate, average rating, views per property and a performance table (each chart has a table view)
- Add/edit listings with **up to 5 photos**, a **map pin**, **stay terms**, **house rules** and **bills included**; room availability steppers
- Listing states as the admin sets them: **In review → Live**, or **Needs changes** with the admin's reason. Editing a sent-back listing resubmits it
- Approve/decline reservation requests (with an optional reason the boarder sees), **reply to reviews**, and **message boarders**

**Admins and super admins** (AdminLTE panel, `backend/admin/`)
- Uses the uploaded AdminLTE template as-is: the olive theme, sidebar, cards, DataTables with Copy / CSV / Excel / PDF / Print, and toastr messages
- **Dashboard**: listings waiting for review (oldest first), site totals, new contact messages; super admins also see recent activity
- **Listings**: In review / Live / Needs changes / Removed tabs. Approve, **send back with a reason**, **remove** (hidden, not deleted) and restore. Each one notifies the landlord. Every listing has a review page with a checklist, its rooms, stay terms, bills, house rules, the landlord's details and its history
- **Boarders & Landlords**: deactivate (with a reason) and reactivate; account pages show listings or reservation requests
- **Reports**: charts (requests per month, rooms by type, new accounts, listings by area) and exportable tables of listings, reservations and accounts
- **Contact Inbox** for messages from the Contact Us page
- **Super admins only**:
  - **User Management**: view, add and edit admin accounts. A new admin picks their own password at first sign-in
  - **Activity Log** of approvals, removals, account changes and sign-ins
- Built-in safeguards:
  - only admin roles can sign in
  - sign-in is throttled after wrong tries
  - every form carries a CSRF token
  - a super admin can't lock themselves out

## Try these demos

- **Guest to boarder:** signed out, open **Find Place to Stay**, try **Near me**, open a room and tap a question under *Worth asking the landlord*. Sign in as Maria and you land back on that room; tap it again and the question is waiting in Messages.
- **Listing review (admin panel):** sign in to the AdminLTE panel as `admin`, open **Listings → Review Queue**, and approve *Riverside Dormitory* or send *Mountain View Bedspace* back with a reason. Then sign in as `superadmin` and open **Activity Log** to see it. (The website shows the result once it's connected to the API; see BACKEND_PLAN.md.)
- **Reservation flow:** as Maria, open a room and send a reservation request. Log out, sign in as Juan, approve or decline it (with a reason) under **Reservation Requests**, then sign back in as Maria to see the result.
- **Forgot password:** on the sign-in page, tap *Forgot password?*, enter `maria@roomease.ph`, and use the code shown in the demo inbox.
- **Review:** as Maria, open **Green Haven Residences** (she has a past stay there) and rate it.
- **Live chat in two tabs:** in tab 1 sign in as Maria with **Remember me unchecked**; in tab 2 sign in as Juan the same way. Messages sent in one tab appear in the other right away.
- **Compare:** tap the scale icon on 2–3 room cards, then **Compare** in the tray at the bottom.

## Project structure

```
backend/
  admin/                     AdminLTE admin and super admin panel (PHP)
    index.php                sign-in
    dashboard.php            page router (?page=…), with who may open each page
    config/conn.php          MySQL connection (WAMP: root, no password)
    includes/                head, navbar, sidebar, footer, helpers, moderation actions
    content/                 the pages: home, listings, view_listing, accounts, inbox, reports,
                             profile; super admin: view_users, add_user, update_user, activity
    dist/, plugins/          AdminLTE 3.2 files the pages use
database/
  roomease.sql               MySQL schema (the PHP version's, extended) with demo data
src/
  App.jsx                    routes (each page lazy-loaded): public site, auth, and role-protected dashboards
  index.css                  Bootstrap theme overrides, per-role colors, dark mode, app styles
  config/navigation.js       sidebar items and role labels
  context/
    AuthContext.jsx          mock accounts: sign in, sign up, profile, password, reset codes
    DataContext.jsx          stand-in backend: listings, reservations, reviews, messages, notifications, contact form
    SitePaths.jsx            room links for the public site vs. the boarder dashboard; guest sign-in prompts
    ThemeContext.jsx         light / dark mode
    ToastContext.jsx         confirmation pop-ups
  data/mockData.js           seed data (dates are relative to today), room types, geo helpers
  data/validation.js         email, phone and password rules (same as the PHP version)
  data/storage.js            safe localStorage helpers
  data/images.js             in-browser photo resizing
  components/
    auth/                    shared sign-in / sign-up layout, password checklist
    charts/                  Chart.js charts and the numbers behind them
    illustrations/           SVG house, room and street scenes
    layout/                  sidebar, top bar, dashboard shell, public site layout
    listings/                room card, listing row, listing status, stay terms, filters, photo gallery, compare
    map/                     Leaflet map, the Browse map view, and the "near me" location hook
    reservations/            reservations table and review dialog
    reviews/                 stars, rating badge, reviews section
    ui/                      cards, badges, tabs, modal, form fields, skeletons, logo, avatar, copy button
  pages/
    Landing.jsx, Login.jsx, Signup.jsx, ForgotPassword.jsx, NotFound.jsx
    public/                  About, Contact, Privacy Policy, Terms & Conditions
    boarder/                 dashboard, browse, room details, compare, reservations, favorites
    landlord/                dashboard, listings, listing form/view, availability, requests, analytics
    shared/                  messages, notifications, profile, settings
```

## Notes

- **The website isn't connected to MySQL yet.** Its accounts and data are saved in the browser's localStorage (passwords included, in plain text, demo only). The admin panel already uses MySQL. [BACKEND_PLAN.md](BACKEND_PLAN.md) covers the PHP API that will replace the insides of `AuthContext.jsx` and `DataContext.jsx`. Until then, no email is sent (reset codes appear on screen), and website contact messages stay in the browser.
- **Not carried over from the PHP version yet** (they need a server): Google sign-in, real email (reset codes, notifications), and several rooms with their own rent inside one boarding house.
- **Start over:** Settings → *Reset demo data* restores the original listings, reservations, reviews and messages.
- **Maps** use free OpenStreetMap tiles, so they need an internet connection. Pin locations are approximate. If tiles can't load, the pins still show.
- **Photos:** landlords can upload up to 5 photos per listing (resized in the browser). Browser storage holds roughly 5 MB, so many large listings can fill it; the app warns you if a save fails. Without photos, illustrations are shown.
- **Deploying:** this is a single-page app using browser routing, so the host must serve `index.html` for unknown paths (e.g. a rewrite rule on Vercel or Netlify).

- **AdminLTE** (MIT licence) is included under `backend/admin/dist` and `backend/admin/plugins`. Only the files the pages load were copied; the rest of the template's plugins can be added from the original AdminLTE download if a page needs one.

See [PLAN.md](PLAN.md) for what has been built so far, and [BACKEND_PLAN.md](BACKEND_PLAN.md) for the PHP + MySQL backend.
