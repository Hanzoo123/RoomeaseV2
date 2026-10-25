# RoomEase — Build Plan

Boarding house finder for Baybay City with two user roles: **Boarder** (looks for rooms) and **Landlord** (lists and manages properties).

## Phase 1 — Frontend prototype (this build) ✅

**Stack:** React 19 + Vite, Tailwind CSS v4, React Router, lucide-react icons. No backend yet; mock data and mock sign-in.

| Area | What's included |
| --- | --- |
| Login | Boarder / Landlord toggle (re-themes blue ↔ green), email + password with show/hide, remember me, wrong-role error, demo accounts with one-click fill |
| Shared layout | Role-themed sidebar with badges, top bar (search, notifications, account menu with logout), footer, mobile slide-out drawer |
| Boarder dashboard | Welcome banner, search (location / min–max rent / room type, filters the list), stats, recommended rooms with favorite toggle, popular locations, call-to-action banner |
| Landlord dashboard | Welcome banner, "Add a Boarding House" banner, stats computed from data, My Boarding Houses list, recent reservation requests with approve/decline dialog, listing approval notice |
| Routing | Role-protected routes (`/boarder`, `/landlord`), redirect to `/login` when signed out, placeholder pages for the remaining sidebar links |

**Theming:** colors are CSS variables set per role (`[data-theme="boarder"|"landlord"]` in `src/index.css`), so the same components render blue for boarders and green for landlords.

**Images:** listing, room and location pictures are SVG illustrations (`src/components/illustrations`). Set `photo` on a listing in `src/data/mockData.js` to switch to a real photo.

## Phase 2 — Remaining pages

- Boarder: Browse Rooms (filters + map), listing details, My Reservations, My Favorites, Notifications, Profile, Settings
- Landlord: My Boarding Houses, Add/Edit Listing form with photo upload, Room Availability, Reservation Requests, Notifications, Profile, Settings
- Sign-up page and password reset

## Phase 3 — Backend

- Real authentication (hashed passwords, sessions/JWT) replacing `AuthContext` mock login
- Database tables: users, boarding_houses, rooms, reservations, favorites, notifications
- API for listings, search, reservations, approvals; image storage for listing photos
- Admin role for approving listings
