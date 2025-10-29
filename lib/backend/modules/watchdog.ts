/**
 * System Watchdog Module
 *
 * Real-time system monitoring for CPU, memory, disk, and network usage.
 * Detects anomalies and potential security threats.
 */

import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SystemStatus {
  cpu: number // Percentage
  memory: number // Percentage
  disk: number // Percentage
  netIn: number // KB/s
  netOut: number // KB/s
  processes: number
  uptime: number // Seconds
  timestamp: string
}

export interface Anomaly {
  time: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: string
  metric: string
  value: number
  threshold: number
}

export interface WatchdogState {
  isRunning: boolean
  pollInterval: number
  history: SystemStatus[]
  anomalies: Anomaly[]
  baselineEstablished: boolean
}

// Global state
let watchdogState: WatchdogState = {
  isRunning: false,
  pollInterval: 5000,
  history: [],
  anomalies: [],
  baselineEstablished: false
}

let monitorInterval: NodeJS.Timeout | null = null

// Baseline thresholds
const THRESHOLDS = {
  cpu: {
    warning: 70,
    critical: 90
  },
  memory: {
    warning: 75,
    critical: 90
  },
  disk: {
    warning: 80,
    critical: 95
  },
  netIn: {
    warning: 10000, // 10 MB/s
    critical: 50000 // 50 MB/s
  },
  netOut: {
    warning: 10000,
    critical: 50000
  },
  processes: {
    warning: 300,
    critical: 500
  }
}

// Previous network stats for calculating deltas
let prevNetStats = { bytesReceived: 0, bytesSent: 0, timestamp: Date.now() }

/**
 * Get CPU usage percentage
 */
function getCpuUsage(): number {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times]
    }
    totalIdle += cpu.times.idle
  })

  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - Math.floor((idle / total) * 100)

  return Math.max(0, Math.min(100, usage))
}

/**
 * Get memory usage percentage
 */
function getMemoryUsage(): number {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  return Math.round((usedMem / totalMem) * 100)
}

/**
 * Get disk usage (Windows, macOS, Linux)
 */
async function getDiskUsage(): Promise<number> {
  try {
    const platform = os.platform()

    if (platform === 'win32') {
      // Windows: Use wmic
      const { stdout } = await execAsync(
        'wmic logicaldisk get size,freespace,caption'
      )
      const lines = stdout.trim().split('\n').slice(1)

      let totalSize = 0
      let totalFree = 0

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 3 && parts[1] !== '') {
          const free = parseInt(parts[1])
          const size = parseInt(parts[2])
          if (!isNaN(free) && !isNaN(size)) {
            totalFree += free
            totalSize += size
          }
        }
      }

      if (totalSize > 0) {
        return Math.round(((totalSize - totalFree) / totalSize) * 100)
      }
    } else if (platform === 'darwin') {
      // macOS: Use df
      const { stdout } = await execAsync("df -k / | tail -1 | awk '{print $5}'")
      const usage = parseInt(stdout.trim().replace('%', ''))
      if (!isNaN(usage)) {
        return usage
      }
    } else {
      // Linux: Use df
      const { stdout } = await execAsync("df -k / | tail -1 | awk '{print $5}'")
      const usage = parseInt(stdout.trim().replace('%', ''))
      if (!isNaN(usage)) {
        return usage
      }
    }
  } catch (error) {
    console.error('Error getting disk usage:', error)
  }

  return 0
}

/**
 * Get network usage (bytes received/sent per second)
 */
async function getNetworkUsage(): Promise<{ netIn: number; netOut: number }> {
  try {
    const platform = os.platform()
    let bytesReceived = 0
    let bytesSent = 0

    if (platform === 'win32') {
      // Windows: Use netstat
      const { stdout } = await execAsync(
        'netstat -e'
      )
      const lines = stdout.split('\n')

      for (const line of lines) {
        if (line.includes('Bytes')) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 3) {
            bytesReceived = parseInt(parts[1].replace(/,/g, '')) || 0
            bytesSent = parseInt(parts[2].replace(/,/g, '')) || 0
            break
          }
        }
      }
    } else if (platform === 'darwin') {
      // macOS: Use netstat
      const { stdout } = await execAsync(
        "netstat -ib | awk '{ if ($1 != \"Name\") { received += $7; sent += $10 }} END { print received, sent }'"
      )
      const parts = stdout.trim().split(' ')
      bytesReceived = parseInt(parts[0]) || 0
      bytesSent = parseInt(parts[1]) || 0
    } else {
      // Linux: Read from /proc/net/dev
      const { stdout } = await execAsync(
        "cat /proc/net/dev | tail -n +3 | awk '{received += $2; sent += $10} END {print received, sent}'"
      )
      const parts = stdout.trim().split(' ')
      bytesReceived = parseInt(parts[0]) || 0
      bytesSent = parseInt(parts[1]) || 0
    }

    // Calculate delta
    const now = Date.now()
    const timeDelta = (now - prevNetStats.timestamp) / 1000 // seconds

    const receivedDelta = Math.max(0, bytesReceived - prevNetStats.bytesReceived)
    const sentDelta = Math.max(0, bytesSent - prevNetStats.bytesSent)

    const netIn = Math.round((receivedDelta / timeDelta) / 1024) // KB/s
    const netOut = Math.round((sentDelta / timeDelta) / 1024) // KB/s

    // Update previous stats
    prevNetStats = { bytesReceived, bytesSent, timestamp: now }

    return { netIn, netOut }
  } catch (error) {
    console.error('Error getting network usage:', error)
    return { netIn: 0, netOut: 0 }
  }
}

/**
 * Get number of running processes
 */
async function getProcessCount(): Promise<number> {
  try {
    const platform = os.platform()

    if (platform === 'win32') {
      const { stdout } = await execAsync('tasklist /fo csv /nh | find /c /v ""')
      return parseInt(stdout.trim()) || 0
    } else {
      const { stdout } = await execAsync('ps aux | wc -l')
      return parseInt(stdout.trim()) - 1 || 0
    }
  } catch (error) {
    console.error('Error getting process count:', error)
    return 0
  }
}

/**
 * Collect current system status
 */
async function collectSystemStatus(): Promise<SystemStatus> {
  const [cpu, memory, disk, network, processes] = await Promise.all([
    Promise.resolve(getCpuUsage()),
    Promise.resolve(getMemoryUsage()),
    getDiskUsage(),
    getNetworkUsage(),
    getProcessCount()
  ])

  return {
    cpu,
    memory,
    disk,
    netIn: network.netIn,
    netOut: network.netOut,
    processes,
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  }
}

/**
 * Detect anomalies in system metrics
 */
function detectAnomalies(status: SystemStatus): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Check CPU
  if (status.cpu >= THRESHOLDS.cpu.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'High CPU Usage',
      severity: 'critical',
      details: `CPU usage is critically high at ${status.cpu}%`,
      metric: 'cpu',
      value: status.cpu,
      threshold: THRESHOLDS.cpu.critical
    })
  } else if (status.cpu >= THRESHOLDS.cpu.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'Elevated CPU Usage',
      severity: 'medium',
      details: `CPU usage is elevated at ${status.cpu}%`,
      metric: 'cpu',
      value: status.cpu,
      threshold: THRESHOLDS.cpu.warning
    })
  }

  // Check Memory
  if (status.memory >= THRESHOLDS.memory.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'Critical Memory Usage',
      severity: 'critical',
      details: `Memory usage is critically high at ${status.memory}%`,
      metric: 'memory',
      value: status.memory,
      threshold: THRESHOLDS.memory.critical
    })
  } else if (status.memory >= THRESHOLDS.memory.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'High Memory Usage',
      severity: 'medium',
      details: `Memory usage is high at ${status.memory}%`,
      metric: 'memory',
      value: status.memory,
      threshold: THRESHOLDS.memory.warning
    })
  }

  // Check Disk
  if (status.disk >= THRESHOLDS.disk.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'Critical Disk Space',
      severity: 'critical',
      details: `Disk usage is critically high at ${status.disk}%`,
      metric: 'disk',
      value: status.disk,
      threshold: THRESHOLDS.disk.critical
    })
  } else if (status.disk >= THRESHOLDS.disk.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'Low Disk Space',
      severity: 'medium',
      details: `Disk usage is high at ${status.disk}%`,
      metric: 'disk',
      value: status.disk,
      threshold: THRESHOLDS.disk.warning
    })
  }

  // Check Network In
  if (status.netIn >= THRESHOLDS.netIn.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'Excessive Network Traffic (Inbound)',
      severity: 'high',
      details: `Unusual inbound traffic: ${status.netIn} KB/s (possible DDoS or data exfiltration)`,
      metric: 'netIn',
      value: status.netIn,
      threshold: THRESHOLDS.netIn.critical
    })
  } else if (status.netIn >= THRESHOLDS.netIn.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'High Network Traffic (Inbound)',
      severity: 'low',
      details: `Elevated inbound traffic: ${status.netIn} KB/s`,
      metric: 'netIn',
      value: status.netIn,
      threshold: THRESHOLDS.netIn.warning
    })
  }

  // Check Network Out
  if (status.netOut >= THRESHOLDS.netOut.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'Excessive Network Traffic (Outbound)',
      severity: 'high',
      details: `Unusual outbound traffic: ${status.netOut} KB/s (possible data leak or botnet activity)`,
      metric: 'netOut',
      value: status.netOut,
      threshold: THRESHOLDS.netOut.critical
    })
  } else if (status.netOut >= THRESHOLDS.netOut.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'High Network Traffic (Outbound)',
      severity: 'low',
      details: `Elevated outbound traffic: ${status.netOut} KB/s`,
      metric: 'netOut',
      value: status.netOut,
      threshold: THRESHOLDS.netOut.warning
    })
  }

  // Check Process Count
  if (status.processes >= THRESHOLDS.processes.critical) {
    anomalies.push({
      time: status.timestamp,
      type: 'Excessive Process Count',
      severity: 'high',
      details: `Unusually high number of processes: ${status.processes} (possible malware activity)`,
      metric: 'processes',
      value: status.processes,
      threshold: THRESHOLDS.processes.critical
    })
  } else if (status.processes >= THRESHOLDS.processes.warning) {
    anomalies.push({
      time: status.timestamp,
      type: 'High Process Count',
      severity: 'low',
      details: `Elevated process count: ${status.processes}`,
      metric: 'processes',
      value: status.processes,
      threshold: THRESHOLDS.processes.warning
    })
  }

  return anomalies
}

/**
 * Monitor system (called periodically)
 */
async function monitorSystem(): Promise<void> {
  try {
    const status = await collectSystemStatus()

    // Add to history
    watchdogState.history.unshift(status)

    // Keep only last 100 readings
    if (watchdogState.history.length > 100) {
      watchdogState.history = watchdogState.history.slice(0, 100)
    }

    // Detect anomalies
    const newAnomalies = detectAnomalies(status)

    if (newAnomalies.length > 0) {
      watchdogState.anomalies.push(...newAnomalies)

      // Keep only last 50 anomalies
      if (watchdogState.anomalies.length > 50) {
        watchdogState.anomalies = watchdogState.anomalies.slice(0, 50)
      }

      // Log critical anomalies
      newAnomalies
        .filter((a) => a.severity === 'critical' || a.severity === 'high')
        .forEach((anomaly) => {
          console.warn(`[WATCHDOG] ${anomaly.type}: ${anomaly.details}`)
        })
    }

    // Establish baseline after 10 readings
    if (!watchdogState.baselineEstablished && watchdogState.history.length >= 10) {
      watchdogState.baselineEstablished = true
      console.log('[WATCHDOG] Baseline established')
    }
  } catch (error) {
    console.error('[WATCHDOG] Error monitoring system:', error)
  }
}

/**
 * Start the system watchdog
 */
export function startWatchdog(pollIntervalMs = 5000): void {
  if (watchdogState.isRunning) {
    console.warn('[WATCHDOG] Already running')
    return
  }

  watchdogState.isRunning = true
  watchdogState.pollInterval = pollIntervalMs

  console.log(`[WATCHDOG] Starting with ${pollIntervalMs}ms interval`)

  // Immediate first reading
  monitorSystem()

  // Schedule periodic monitoring
  monitorInterval = setInterval(monitorSystem, pollIntervalMs)
}

/**
 * Stop the system watchdog
 */
export function stopWatchdog(): void {
  if (!watchdogState.isRunning) {
    console.warn('[WATCHDOG] Not running')
    return
  }

  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }

  watchdogState.isRunning = false
  console.log('[WATCHDOG] Stopped')
}

/**
 * Get current system status
 */
export async function getSystemStatus(): Promise<{
  current: SystemStatus | null
  isRunning: boolean
  history: SystemStatus[]
  anomalies: Anomaly[]
  baselineEstablished: boolean
  healthScore: number
}> {
  const current = watchdogState.history[0] || null

  // Calculate health score (0-100)
  let healthScore = 100

  if (current) {
    healthScore -= Math.max(0, (current.cpu - 50) / 50) * 30
    healthScore -= Math.max(0, (current.memory - 60) / 40) * 30
    healthScore -= Math.max(0, (current.disk - 70) / 30) * 20
    healthScore -= watchdogState.anomalies.filter((a) => a.severity === 'critical').length * 10
    healthScore -= watchdogState.anomalies.filter((a) => a.severity === 'high').length * 5
    healthScore = Math.max(0, Math.min(100, healthScore))
  }

  return {
    current,
    isRunning: watchdogState.isRunning,
    history: watchdogState.history,
    anomalies: watchdogState.anomalies,
    baselineEstablished: watchdogState.baselineEstablished,
    healthScore: Math.round(healthScore)
  }
}

/**
 * Clear anomaly history
 */
export function clearAnomalies(): void {
  watchdogState.anomalies = []
  console.log('[WATCHDOG] Anomalies cleared')
}

/**
 * Get watchdog statistics
 */
export function getWatchdogStats(): {
  totalReadings: number
  totalAnomalies: number
  criticalAnomalies: number
  avgCpu: number
  avgMemory: number
  avgDisk: number
} {
  const history = watchdogState.history

  return {
    totalReadings: history.length,
    totalAnomalies: watchdogState.anomalies.length,
    criticalAnomalies: watchdogState.anomalies.filter(
      (a) => a.severity === 'critical' || a.severity === 'high'
    ).length,
    avgCpu: history.length > 0
      ? Math.round(history.reduce((sum, s) => sum + s.cpu, 0) / history.length)
      : 0,
    avgMemory: history.length > 0
      ? Math.round(history.reduce((sum, s) => sum + s.memory, 0) / history.length)
      : 0,
    avgDisk: history.length > 0
      ? Math.round(history.reduce((sum, s) => sum + s.disk, 0) / history.length)
      : 0
  }
}
