import './styles/app.css'
import Main from './components/main/Main'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './routes/login/Login'
import Dashboard from './routes/dashboard/Dashboard'
import Agent from './routes/agent/Agent'
import Vault from './routes/vault/Vault'
import Reports from './routes/reports/Reports'
import QuickScan from './routes/scan/QuickScan'
import Settings from './routes/settings/Settings'
import LinkChecker from './routes/link-checker/LinkChecker'
import EmailAnalyzer from './routes/email-analyzer/EmailAnalyzer'
import PhishingAnalyzer from './routes/phishing/PhishingAnalyzer'
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
          path="/scan"
          element={
            <ProtectedRoute>
              <QuickScan />
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
          path="/link-checker"
          element={
            <ProtectedRoute>
              <LinkChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/email-analyzer"
          element={
            <ProtectedRoute>
              <EmailAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/phishing"
          element={
            <ProtectedRoute>
              <PhishingAnalyzer />
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
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
      {/*</BrowserRouter>*/}
    </Main>
  )
}
