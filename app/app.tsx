import './styles/app.css'
import Main from './components/main/Main'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './routes/login/Login'
import Dashboard from './routes/dashboard/Dashboard'
import Agent from './routes/agent/Agent'
import Vault from './routes/vault/Vault'
import Reports from './routes/reports/Reports'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Main>
      {/*<BrowserRouter>*/}
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
        <Route
          path="/agent"
          element={
            <ProtectedRoute>
              <Agent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <Vault />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Routes>
      {/*</BrowserRouter>*/}
    </Main>
  )
}
