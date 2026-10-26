# RoomEase — Build Plan

Boarding house finder for Baybay City with four user roles: **Boarder** (looks for rooms) and **Landlord** (lists and manages properties) use the React website. **Admin** and **Super Admin** (review listings, manage accounts) use the AdminLTE panel. Guests can browse rooms without an account.

## Phase 1 — Frontend prototype (this build) ✅

**Stack:** React 19 + Vite, Bootstrap 5.3, React Router, lucide-react icons. No backend yet; mock data and mock sign-in.

| Area | What's included |
| --- | --- |
| Login | Boarder / Landlord toggle (re-themes blue ↔ green), email + password with show/hide, remember me, wrong-role error, demo accounts with one-click fill |
| Shared layout | Role-themed sidebar with badges, top bar (search, notifications, account menu with logout), footer, mobile slide-out drawer |
| Boarder dashboard | Welcome banner, search (location / min–max rent / room type, filters the list), stats, recommended rooms with favorite toggle, popular locations, call-to-action banner |
| Landlord dashboard | Welcome banner, "Add a Boarding House" banner, stats computed from data, My Boarding Houses list, recent reservation requests with approve/decline dialog, listing approval notice |
| Routing | Role-protected routes (`/boarder`, `/landlord`), redirect to `/login` when signed out, placeholder pages for the remaining sidebar links |

**Theming:** Bootstrap's CSS variables (`--bs-primary`, button and form colors) are pointed at per-role colors in `src/index.css` (`[data-theme="boarder"|"landlord"]`), so the same Bootstrap components render blue for boarders and green for landlords. Modals, dropdowns and the mobile offcanvas use Bootstrap markup but are opened by React state, so `bootstrap.js` isn't needed.

**Images:** listing, room and location pictures are SVG illustrations (`src/components/illustrations`). Set `photo` on a listing in `src/data/mockData.js` to switch to a real photo.

## Phase 2 — Remaining pages ✅

| Area | What's included |
| --- | --- |
| Sign-up | Boarder / Landlord account creation with validation; new accounts are saved in the browser and signed in right away |
| Boarder | Browse Rooms (search, location, rent range, room type, amenities, availability, sort; filters live in the URL), Room Details (gallery, amenities, landlord contact, reservation request form), My Reservations (status tabs, cancel), My Favorites + recently viewed |
| Landlord | My Boarding Houses (approval tabs, delete), Add/Edit Listing form with photo upload, Listing view with its requests, Room Availability steppers, Reservation Requests (status tabs, property filter, approve/decline) |
| Both | Notifications (unread badge, mark all read, dismiss), My Profile (edit name/email/phone), Settings (notification toggles, change password, reset demo data, log out), 404 page |

**Data:** `DataContext` acts as a stand-in backend. Listings, reservations, favorites and notifications are saved to `localStorage`, so both roles share them in the same browser (a boarder's request shows up for the landlord, and the landlord's decision notifies the boarder). Settings → *Reset demo data* restores the seed data.

**Demo-only shortcuts:** notification toggles are saved but don't filter anything yet. (New listings used to have an *Approve now (demo)* button; the admin panel in Phase 2.6 replaced it.)

## Phase 2.5 — Polish and extra features ✅

| Feature | What's included |
| --- | --- |
| Landing page | Public homepage: navbar, hero with search and floating cards, stats, features, top-rated rooms, how it works (boarder/landlord tabs), areas, reviews, landlord call-to-action, FAQ accordion, footer |
| Dark mode | Bootstrap 5.3 `data-bs-theme`, toggle in top bar / account menu / landing / auth pages, saved per browser, no flash on load |
| Ratings & reviews | Stars on cards, rating summary with distribution, write/edit/delete (approved stays only), landlord replies, "Top rated" sort |
| Photo gallery | Bootstrap carousel (swipe, arrow keys, thumbnails, full-screen viewer); up to 5 photos per listing with cover selection |
| Map view | Leaflet + OpenStreetMap: Browse grid/map toggle with price pins linked to the list, location map with distances on Room Details, pin picker in the listing form |
| Compare rooms | Up to 3 rooms, floating tray, side-by-side table with best values highlighted, distance to VSU |
| Messages | Two-pane chat for both roles with unread badges; start from Room Details or a reservation; syncs live across browser tabs |
| Analytics | Chart.js: requests per month by status, status breakdown, occupancy and views per property, KPI tiles, performance table, table view for every chart |
| Polish | Toast confirmations, page fade-ins, loading skeletons with lazy-loaded pages, relative demo dates |

## Phase 2.6 — Parity with the PHP version ✅

Features from [Hanzoo123/Roomease](https://github.com/Hanzoo123/Roomease) that the React app didn't have yet.

| Feature | What's included |
| --- | --- |
| Find Place to Stay | Public browse, room and compare pages at `/rooms` (no account needed), public menu Home · Find Place to Stay · About Us · Contact Us, sign-in prompts that return the boarder to the same room |
| Admin panel | A first React admin panel (replaced in Phase 2.7 by the AdminLTE panel, which is required for admins and super admins). It also replaced the old *Approve now (demo)* button |
| Stay terms | Curfew, minimum stay, who can stay, visitors, cooking, pets, payment methods, house rules and bills included, in the listing form and on the room page |
| Room types | Single Room, Private Room, Double Sharing, Bed Spacer, Dormitory, with photo tiles on the landing page |
| Decline reasons | Landlords can give a reason when declining; boarders see it |
| Near me | Location-based sort, within-X-km filter, "Show my location" on the room map |
| Public pages | About (with the capstone team), Contact (form to the admin inbox), Privacy Policy, Terms & Conditions |
| Accounts | Forgot password with a 6-digit code, password checklist, PH mobile number check, profile photo |

## Phase 2.7 — AdminLTE admin panel and MySQL ✅

| Part | What's included |
| --- | --- |
| Admin panel | The uploaded AdminLTE template (design unchanged) in `backend/admin/`, PHP + MySQL for WAMP64. Admin and Super Admin roles, listing moderation with reasons, boarders and landlords, reports with exports, contact inbox, admin accounts and activity log (super admin) |
| Database | `database/roomease.sql`: the PHP version's schema plus reviews, conversations, messages, notifications and contact messages, with the same demo data as the website |
| Website | The React admin pages were removed; admins are sent to the AdminLTE panel |

## Phase 3 — Backend (see [BACKEND_PLAN.md](BACKEND_PLAN.md))

The database and the admin panel are done. What remains is a PHP JSON API in `backend/api/` that connects the React website to the same MySQL database. It is built in phases:

1. Accounts (sign-up, sign-in, sessions, CSRF), with the React `AuthContext` switched to the API
2. Public listings (Find Place to Stay and room pages from MySQL)
3. Landlord listings, several rooms per house with their own rent, photos and availability
4. Reservations, favorites, reviews and analytics
5. Messages, notifications (polling) and the contact form into the AdminLTE inbox
6. Real email for password reset codes; "Remember me"
7. A production build served by WAMP
