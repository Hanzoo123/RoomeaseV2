import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import { FullPageSpinner } from './components/ui/feedback'

// Each page is its own chunk, loaded on first visit (the layout shows a skeleton meanwhile).
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Notifications = lazy(() => import('./pages/shared/Notifications'))
const Messages = lazy(() => import('./pages/shared/Messages'))
const Profile = lazy(() => import('./pages/shared/Profile'))
const Settings = lazy(() => import('./pages/shared/Settings'))
const BoarderDashboard = lazy(() => import('./pages/boarder/BoarderDashboard'))
const BrowseRooms = lazy(() => import('./pages/boarder/BrowseRooms'))
const RoomDetails = lazy(() => import('./pages/boarder/RoomDetails'))
const MyReservations = lazy(() => import('./pages/boarder/MyReservations'))
const MyFavorites = lazy(() => import('./pages/boarder/MyFavorites'))
const CompareRooms = lazy(() => import('./pages/boarder/CompareRooms'))
const LandlordDashboard = lazy(() => import('./pages/landlord/LandlordDashboard'))
const MyListings = lazy(() => import('./pages/landlord/MyListings'))
const ListingForm = lazy(() => import('./pages/landlord/ListingForm'))
const ListingView = lazy(() => import('./pages/landlord/ListingView'))
const RoomAvailability = lazy(() => import('./pages/landlord/RoomAvailability'))
const ReservationRequests = lazy(() => import('./pages/landlord/ReservationRequests'))
const Analytics = lazy(() => import('./pages/landlord/Analytics'))

// Sends signed-out visitors to /login and keeps each role inside its own dashboard.
function RequireRole({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search, role }} />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/boarder"
          element={
            <RequireRole role="boarder">
              <DashboardLayout role="boarder" />
            </RequireRole>
          }
        >
          <Route index element={<BoarderDashboard />} />
          <Route path="browse" element={<BrowseRooms />} />
          <Route path="rooms/:listingId" element={<RoomDetails />} />
          <Route path="compare" element={<CompareRooms />} />
          <Route path="reservations" element={<MyReservations />} />
          <Route path="favorites" element={<MyFavorites />} />
          <Route path="messages" element={<Messages role="boarder" />} />
          <Route path="messages/:conversationId" element={<Messages role="boarder" />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound role="boarder" />} />
        </Route>

        <Route
          path="/landlord"
          element={
            <RequireRole role="landlord">
              <DashboardLayout role="landlord" />
            </RequireRole>
          }
        >
          <Route index element={<LandlordDashboard />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="listings/:listingId" element={<ListingView />} />
          <Route path="listings/:listingId/edit" element={<ListingForm />} />
          <Route path="add-listing" element={<ListingForm />} />
          <Route path="availability" element={<RoomAvailability />} />
          <Route path="reservations" element={<ReservationRequests />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="messages" element={<Messages role="landlord" />} />
          <Route path="messages/:conversationId" element={<Messages role="landlord" />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound role="landlord" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
