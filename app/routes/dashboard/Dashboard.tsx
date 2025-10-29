import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Radar,
  Shield,
  Activity,
  AlertTriangle,
  Lock,
  TrendingUp,
  Cpu,
  HardDrive,
  Network,
  Mail,
  Database
} from 'lucide-react'
import { useConveyor } from '../../hooks/use-conveyor'

interface DashboardData {
  systemHealth: {
    score: number
    status: string
    cpu: number
    memory: number
    disk: number
    isMonitoring: boolean
  }
  scans: {
    totalScans: number
    cleanCount: number
    suspiciousCount: number
    maliciousCount: number
    lastScanTime: string | null
  }
  vault: {
    isProtected: boolean
    blockchainVerified: boolean
  }
  watchdog: {
    criticalAnomalies: number
  }
  breaches: {
    email: string
    breachCount: number
    breaches: string[]
    status: string
  } | null
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const conveyor = useConveyor('security')

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const snapshot = await conveyor.getDashboardSnapshot(user?.email)
      const securityAlerts = await conveyor.getSecurityAlerts()

      setDashboardData(snapshot)
      setAlerts(securityAlerts.slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 75) return 'text-blue-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 border-red-500'
      case 'high':
        return 'bg-orange-500/20 border-orange-500'
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500'
      default:
        return 'bg-blue-500/20 border-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="size-full p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
        >
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* System Health */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-primary" size={24} />
            <h3 className="text-sm font-medium text-gray-400">System Health</h3>
          </div>
          <p className={`text-4xl font-light ${getHealthColor(dashboardData?.systemHealth.score || 0)}`}>
            {dashboardData?.systemHealth.score || 0}%
          </p>
          <p className="text-xs text-gray-600 mt-1 capitalize">
            {dashboardData?.systemHealth.status || 'Unknown'}
          </p>
        </div>

        {/* Total Scans */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <Radar className="text-blue-500" size={24} />
            <h3 className="text-sm font-medium text-gray-400">Total Scans</h3>
          </div>
          <p className="text-4xl font-light">{dashboardData?.scans.totalScans || 0}</p>
          <p className="text-xs text-gray-600 mt-1">
            {dashboardData?.scans.cleanCount || 0} clean
          </p>
        </div>

        {/* Threats Blocked */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <h3 className="text-sm font-medium text-gray-400">Threats Detected</h3>
          </div>
          <p className="text-4xl font-light">
            {(dashboardData?.scans.suspiciousCount || 0) +
              (dashboardData?.scans.maliciousCount || 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {dashboardData?.scans.maliciousCount || 0} malicious
          </p>
        </div>

        {/* Vault Status */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <Lock
              className={dashboardData?.vault.isProtected ? 'text-green-500' : 'text-gray-500'}
              size={24}
            />
            <h3 className="text-sm font-medium text-gray-400">Vault Status</h3>
          </div>
          <p className="text-4xl font-light">
            {dashboardData?.vault.isProtected ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {dashboardData?.vault.blockchainVerified ? 'Verified' : 'Not set up'}
          </p>
        </div>
      </div>

      {/* Data Breach Alert */}
      {dashboardData?.breaches && dashboardData.breaches.status === 'success' && (
        <div className="mb-8">
          <div
            className={`bg-card border p-6 ${
              dashboardData.breaches.breachCount > 0
                ? 'border-orange-500 bg-orange-500/5'
                : 'border-green-500 bg-green-500/5'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 ${
                  dashboardData.breaches.breachCount > 0
                    ? 'bg-orange-500/20'
                    : 'bg-green-500/20'
                }`}
              >
                <Database
                  className={dashboardData.breaches.breachCount > 0 ? 'text-orange-500' : 'text-green-500'}
                  size={32}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-light">Data Breach Monitor</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail size={16} />
                    <span>{dashboardData.breaches.email}</span>
                  </div>
                </div>
                {dashboardData.breaches.breachCount > 0 ? (
                  <>
                    <p className="text-orange-400 font-medium mb-3">
                      {dashboardData.breaches.breachCount} data breach
                      {dashboardData.breaches.breachCount !== 1 ? 'es' : ''} detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dashboardData.breaches.breaches.map((breach, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-sm"
                        >
                          {breach}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      Your email was found in {dashboardData.breaches.breachCount} known data breach
                      {dashboardData.breaches.breachCount !== 1 ? 'es' : ''}. Consider changing your
                      passwords for these services.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-green-400 font-medium mb-2">No data breaches detected</p>
                    <p className="text-xs text-gray-600">
                      Your email has not been found in any known data breaches. Keep using strong, unique
                      passwords for each service.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-primary" />
              <span className="text-sm">CPU</span>
            </div>
            <span className="text-lg font-light">{dashboardData?.systemHealth.cpu || 0}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${dashboardData?.systemHealth.cpu || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              <span className="text-sm">Memory</span>
            </div>
            <span className="text-lg font-light">{dashboardData?.systemHealth.memory || 0}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${dashboardData?.systemHealth.memory || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-green-500" />
              <span className="text-sm">Disk</span>
            </div>
            <span className="text-lg font-light">{dashboardData?.systemHealth.disk || 0}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${dashboardData?.systemHealth.disk || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-light mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/scan')}
              className="w-full bg-card border border-border hover:border-primary transition-all p-4 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 group-hover:bg-primary/20 transition-all">
                  <Radar className="text-primary" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium">Network Scan</h3>
                  <p className="text-xs text-gray-600">Scan your network for vulnerabilities</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/agent')}
              className="w-full bg-card border border-border hover:border-primary transition-all p-4 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                  <TrendingUp className="text-blue-500" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium">AI Security Advisor</h3>
                  <p className="text-xs text-gray-600">Get security guidance and tips</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/vault')}
              className="w-full bg-card border border-border hover:border-primary transition-all p-4 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 group-hover:bg-green-500/20 transition-all">
                  <Lock className="text-green-500" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium">Password Vault</h3>
                  <p className="text-xs text-gray-600">Manage secure credentials</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Security Alerts */}
        <div>
          <h2 className="text-xl font-light mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-card border border-border p-6 text-center">
                <Shield className="mx-auto mb-2 text-green-500" size={32} />
                <p className="text-sm text-gray-600">No security alerts</p>
                <p className="text-xs text-gray-700 mt-1">All systems secure</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-card border p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
