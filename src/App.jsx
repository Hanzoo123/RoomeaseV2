import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import ComingSoon from './pages/ComingSoon'
import BoarderDashboard from './pages/boarder/BoarderDashboard'
import LandlordDashboard from './pages/landlord/LandlordDashboard'

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

      <Route
        path="/boarder"
        element={
          <RequireRole role="boarder">
            <DashboardLayout role="boarder" />
          </RequireRole>
        }
      >
        <Route index element={<BoarderDashboard />} />
        <Route path=":section" element={<ComingSoon role="boarder" />} />
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
        <Route path=":section" element={<ComingSoon role="landlord" />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
