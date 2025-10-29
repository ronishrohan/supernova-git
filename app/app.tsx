import './styles/app.css'
import Main from './components/main/Main'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './routes/login/Login'
import Dashboard from './routes/dashboard/Dashboard'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Main>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Main>
  )
}
