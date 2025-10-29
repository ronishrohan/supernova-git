/**
 * Dashboard Module
 *
 * Aggregates data from all security modules for dashboard display.
 */

import { getScanStats, getScanHistory } from './scanner'
import { getSystemStatus, getWatchdogStats } from './watchdog'
import { getBlockchainInfo } from './blockchain'

export interface DashboardSnapshot {
  systemHealth: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
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
    recentScans: Array<{
      id: string
      type: string
      verdict: string
      timestamp: string
    }>
  }
  vault: {
    isProtected: boolean
    blockchainVerified: boolean
    totalBlocks: number
    lastVerification: string | null
  }
  watchdog: {
    totalReadings: number
    totalAnomalies: number
    criticalAnomalies: number
    avgCpu: number
    avgMemory: number
  }
  timestamp: string
}

export interface QuickStats {
  threatsBlocked: number
  systemHealth: number
  vaultEntries: number
  activeMonitoring: boolean
}

/**
 * Get comprehensive dashboard snapshot
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  // Get scan statistics
  const scanStats = await getScanStats()

  // Get recent scan history (last 5)
  const scanHistory = await getScanHistory(5)
  const recentScans = scanHistory.map((scan) => ({
    id: scan.id,
    type: scan.scanType,
    verdict: scan.verdict,
    timestamp: scan.timestamp
  }))

  // Get system status
  const systemStatus = await getSystemStatus()

  // Determine system health status
  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  if (systemStatus.healthScore >= 90) healthStatus = 'excellent'
  else if (systemStatus.healthScore >= 75) healthStatus = 'good'
  else if (systemStatus.healthScore >= 60) healthStatus = 'fair'
  else if (systemStatus.healthScore >= 40) healthStatus = 'poor'
  else healthStatus = 'critical'

  // Get watchdog statistics
  const watchdogStats = getWatchdogStats()

  // Get blockchain info
  const blockchainInfo = await getBlockchainInfo()

  return {
    systemHealth: {
      score: systemStatus.healthScore,
      status: healthStatus,
      cpu: systemStatus.current?.cpu || 0,
      memory: systemStatus.current?.memory || 0,
      disk: systemStatus.current?.disk || 0,
      isMonitoring: systemStatus.isRunning
    },
    scans: {
      totalScans: scanStats.totalScans,
      cleanCount: scanStats.cleanCount,
      suspiciousCount: scanStats.suspiciousCount,
      maliciousCount: scanStats.maliciousCount,
      lastScanTime: scanStats.lastScanTime,
      recentScans
    },
    vault: {
      isProtected: blockchainInfo.totalBlocks > 1, // More than genesis block
      blockchainVerified: blockchainInfo.chainValid,
      totalBlocks: blockchainInfo.totalBlocks,
      lastVerification: blockchainInfo.latestBlock?.timestamp || null
    },
    watchdog: {
      totalReadings: watchdogStats.totalReadings,
      totalAnomalies: watchdogStats.totalAnomalies,
      criticalAnomalies: watchdogStats.criticalAnomalies,
      avgCpu: watchdogStats.avgCpu,
      avgMemory: watchdogStats.avgMemory
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * Get quick statistics for dashboard cards
 */
export async function getQuickStats(): Promise<QuickStats> {
  const scanStats = await getScanStats()
  const systemStatus = await getSystemStatus()

  return {
    threatsBlocked: scanStats.suspiciousCount + scanStats.maliciousCount,
    systemHealth: systemStatus.healthScore,
    vaultEntries: 0, // Will be populated by frontend based on loaded vault
    activeMonitoring: systemStatus.isRunning
  }
}

/**
 * Get system overview for dashboard
 */
export async function getSystemOverview(): Promise<{
  uptime: number
  platform: string
  arch: string
  nodeVersion: string
  totalMemory: number
  freeMemory: number
}> {
  const os = await import('os')

  return {
    uptime: os.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem()
  }
}

/**
 * Get security alerts (recent anomalies + malicious scans)
 */
export async function getSecurityAlerts(): Promise<
  Array<{
    id: string
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
  }>
> {
  const alerts: Array<{
    id: string
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
  }> = []

  // Get recent malicious scans
  const recentScans = await getScanHistory(20)
  const maliciousScans = recentScans.filter(
    (scan) => scan.verdict === 'malicious' || scan.verdict === 'suspicious'
  )

  for (const scan of maliciousScans) {
    alerts.push({
      id: scan.id,
      type: 'threat_detected',
      severity: scan.verdict === 'malicious' ? 'high' : 'medium',
      message: `${scan.scanType.toUpperCase()} scan detected ${scan.verdict} content`,
      timestamp: scan.timestamp
    })
  }

  // Get system anomalies
  const systemStatus = await getSystemStatus()
  const recentAnomalies = systemStatus.anomalies.slice(0, 10)

  for (const anomaly of recentAnomalies) {
    alerts.push({
      id: `anomaly-${Date.now()}-${Math.random()}`,
      type: 'system_anomaly',
      severity: anomaly.severity,
      message: anomaly.details,
      timestamp: anomaly.time
    })
  }

  // Sort by timestamp (most recent first)
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return alerts.slice(0, 10) // Return top 10 alerts
}

/**
 * Get activity timeline for dashboard
 */
export async function getActivityTimeline(): Promise<
  Array<{
    id: string
    action: string
    details: string
    timestamp: string
    icon: string
  }>
> {
  const timeline: Array<{
    id: string
    action: string
    details: string
    timestamp: string
    icon: string
  }> = []

  // Get recent scans
  const recentScans = await getScanHistory(5)
  for (const scan of recentScans) {
    timeline.push({
      id: scan.id,
      action: `${scan.scanType} scan completed`,
      details: `Verdict: ${scan.verdict} (score: ${scan.score})`,
      timestamp: scan.timestamp,
      icon: 'scan'
    })
  }

  // Get recent anomalies
  const systemStatus = await getSystemStatus()
  const recentAnomalies = systemStatus.anomalies.slice(0, 3)

  for (const anomaly of recentAnomalies) {
    timeline.push({
      id: `anomaly-${Date.now()}`,
      action: anomaly.type,
      details: anomaly.details,
      timestamp: anomaly.time,
      icon: 'alert'
    })
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return timeline.slice(0, 10)
}

/**
 * Get protection status summary
 */
export async function getProtectionStatus(): Promise<{
  firewall: boolean
  antivirus: boolean
  encryption: boolean
  monitoring: boolean
  vault: boolean
}> {
  const systemStatus = await getSystemStatus()
  const blockchainInfo = await getBlockchainInfo()

  return {
    firewall: true, // Assume OS firewall is active
    antivirus: true, // Assume system has AV
    encryption: blockchainInfo.chainValid,
    monitoring: systemStatus.isRunning,
    vault: blockchainInfo.totalBlocks > 1
  }
}
