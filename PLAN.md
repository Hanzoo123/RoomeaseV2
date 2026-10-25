# RoomEase — Build Plan

Boarding house finder for Baybay City with three user roles: **Boarder** (looks for rooms), **Landlord** (lists and manages properties) and **Admin** (reviews listings and manages accounts). Guests can browse rooms without an account.

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
| Admin panel | Dashboard, Manage Listings (approve, reject with reason, remove/restore), listing review page with checklist and history, Manage Users (deactivate/reactivate), Reports with CSV export, Activity Log, Contact Inbox. Replaces the old *Approve now (demo)* button |
| Stay terms | Curfew, minimum stay, who can stay, visitors, cooking, pets, payment methods, house rules and bills included, in the listing form and on the room page |
| Room types | Single Room, Private Room, Double Sharing, Bed Spacer, Dormitory, with photo tiles on the landing page |
| Decline reasons | Landlords can give a reason when declining; boarders see it |
| Near me | Location-based sort, within-X-km filter, "Show my location" on the room map |
| Public pages | About (with the capstone team), Contact (form to the admin inbox), Privacy Policy, Terms & Conditions |
| Accounts | Forgot password with a 6-digit code, password checklist, PH mobile number check, profile photo |

## Phase 3 — Backend

- Real authentication (hashed passwords, sessions/JWT) replacing `AuthContext` mock login
- Database tables: users, boarding_houses, rooms, reservations, favorites, notifications
- API for listings, search, reservations, approvals; image storage for listing photos
- Server-side admin checks (the admin panel exists, but roles are only enforced in the browser)
- Real email / SMS notifications honoring the notification settings
- Real-time messaging (e.g. WebSockets) instead of same-browser sync
- Photo storage (e.g. cloud storage) instead of browser storage
- Email delivery for password reset codes and contact messages (the flow exists; codes are shown on screen)
- Google sign-in, and several rooms with their own rent per boarding house (as in the PHP version)
