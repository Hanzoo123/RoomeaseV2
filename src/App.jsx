import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import Notifications from './pages/shared/Notifications'
import Profile from './pages/shared/Profile'
import Settings from './pages/shared/Settings'
import BoarderDashboard from './pages/boarder/BoarderDashboard'
import BrowseRooms from './pages/boarder/BrowseRooms'
import RoomDetails from './pages/boarder/RoomDetails'
import MyReservations from './pages/boarder/MyReservations'
import MyFavorites from './pages/boarder/MyFavorites'
import LandlordDashboard from './pages/landlord/LandlordDashboard'
import MyListings from './pages/landlord/MyListings'
import ListingForm from './pages/landlord/ListingForm'
import ListingView from './pages/landlord/ListingView'
import RoomAvailability from './pages/landlord/RoomAvailability'
import ReservationRequests from './pages/landlord/ReservationRequests'

// Sends signed-out visitors to /login and keeps each role inside its own dashboard.
function RequireRole({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search, role }} />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? `/${user.role}` : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
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
        <Route path="reservations" element={<MyReservations />} />
        <Route path="favorites" element={<MyFavorites />} />
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
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound role="landlord" />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
