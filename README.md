# RoomEase

Find and manage boarding houses in Baybay City. Frontend prototype (React + Bootstrap 5) with sign-in/sign-up and full dashboards for **boarders** (browse, reserve, favorites) and **landlords** (listings, availability, reservation requests).

| Login | Boarder | Landlord |
| --- | --- | --- |
| ![Login](docs/screenshots/login.png) | ![Boarder dashboard](docs/screenshots/boarder-dashboard.png) | ![Landlord dashboard](docs/screenshots/landlord-dashboard.png) |

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with a demo account (or click **Use** on the login page):

| Role | Email | Password |
| --- | --- | --- |
| Boarder | `maria@roomease.ph` | `boarder123` |
| Landlord | `juan@roomease.ph` | `landlord123` |

Try the full flow: sign in as Maria, open a room and send a reservation request, log out, sign in as Juan and approve it under **Reservation Requests**, then sign back in as Maria to see the notification.

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`, `npm run lint`.

## Project structure

```
src/
  App.jsx                    routes + role protection
  index.css                  Bootstrap theme overrides, per-role colors, app styles
  config/navigation.js       sidebar items and role labels
  context/AuthContext.jsx    mock accounts: sign in, sign up, profile, password
  context/DataContext.jsx    stand-in backend: listings, reservations, favorites, notifications
  data/mockData.js           seed data (demo users, listings, reservations, notifications)
  data/storage.js            safe localStorage helpers
  components/
    auth/                    shared sign-in / sign-up layout
    layout/                  sidebar, top bar, dashboard shell
    listings/                room card, listing row, filter inputs
    reservations/            reservations table and review dialog
    ui/                      cards, badges, tabs, modal, form fields, logo
    illustrations/           SVG house, room and street scenes
  pages/
    Login.jsx, Signup.jsx, NotFound.jsx
    boarder/                 dashboard, browse, room details, reservations, favorites
    landlord/                dashboard, listings, listing form/view, availability, requests
    shared/                  notifications, profile, settings
```

## Notes

- **No backend yet.** Accounts and app data are saved in the browser's localStorage (passwords included, in plain text — demo only). Replace the functions in `AuthContext.jsx` and `DataContext.jsx` with API calls when the backend is ready.
- **Start over:** Settings → *Reset demo data* restores the original listings and reservations.
- **Real photos:** landlords can upload a photo in the listing form, or put images in `public/images/` and set `photo: '/images/your-file.jpg'` on a seed listing in `mockData.js`. Without a photo, an illustration is shown.
- **Deploying:** this is a single-page app using browser routing, so the host must serve `index.html` for unknown paths (e.g. a rewrite rule on Vercel or Netlify).

See [PLAN.md](PLAN.md) for the build plan and next phases.
