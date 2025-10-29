/**
 * Network Scanner Module
 *
 * Performs network scanning including IP detection, port scanning, and device discovery.
 */

import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import dns from 'dns/promises'

const execAsync = promisify(exec)

export interface NetworkInfo {
  localIP: string
  publicIP: string | null
  gateway: string | null
  subnet: string
  macAddress: string | null
  interfaceName: string
}

export interface PortScanResult {
  port: number
  status: 'open' | 'closed' | 'filtered'
  service: string
  protocol: string
}

export interface NetworkScanResult {
  id: string
  target: string
  networkInfo: NetworkInfo
  openPorts: PortScanResult[]
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    port?: number
  }>
  devices: Array<{
    ip: string
    hostname: string | null
    mac: string | null
    status: 'online' | 'offline'
  }>
  summary: string
  timestamp: string
  duration: number // milliseconds
}

// Common ports to scan
const COMMON_PORTS = [
  { port: 21, service: 'FTP', protocol: 'tcp' },
  { port: 22, service: 'SSH', protocol: 'tcp' },
  { port: 23, service: 'Telnet', protocol: 'tcp' },
  { port: 25, service: 'SMTP', protocol: 'tcp' },
  { port: 53, service: 'DNS', protocol: 'udp' },
  { port: 80, service: 'HTTP', protocol: 'tcp' },
  { port: 110, service: 'POP3', protocol: 'tcp' },
  { port: 143, service: 'IMAP', protocol: 'tcp' },
  { port: 443, service: 'HTTPS', protocol: 'tcp' },
  { port: 445, service: 'SMB', protocol: 'tcp' },
  { port: 3306, service: 'MySQL', protocol: 'tcp' },
  { port: 3389, service: 'RDP', protocol: 'tcp' },
  { port: 5432, service: 'PostgreSQL', protocol: 'tcp' },
  { port: 5900, service: 'VNC', protocol: 'tcp' },
  { port: 8080, service: 'HTTP-Alt', protocol: 'tcp' },
  { port: 27017, service: 'MongoDB', protocol: 'tcp' }
]

/**
 * Get local network information
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const interfaces = os.networkInterfaces()
  let localIP = '127.0.0.1'
  let interfaceName = 'lo'
  let macAddress: string | null = null

  // Find the first non-internal IPv4 address
  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue

    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIP = addr.address
        interfaceName = name
        macAddress = addr.mac || null
        break
      }
    }

    if (localIP !== '127.0.0.1') break
  }

  // Calculate subnet
  const subnet = localIP.split('.').slice(0, 3).join('.') + '.0/24'

  // Try to get gateway
  let gateway: string | null = null
  try {
    const platform = os.platform()

    if (platform === 'win32') {
      const { stdout } = await execAsync('ipconfig')
      const gatewayMatch = stdout.match(/Default Gateway[.\s]*:\s*([0-9.]+)/)
      if (gatewayMatch) {
        gateway = gatewayMatch[1]
      }
    } else if (platform === 'darwin') {
      const { stdout } = await execAsync("netstat -nr | grep default | awk '{print $2}' | head -1")
      gateway = stdout.trim() || null
    } else {
      // Linux
      const { stdout } = await execAsync("ip route | grep default | awk '{print $3}' | head -1")
      gateway = stdout.trim() || null
    }
  } catch (error) {
    console.error('Error getting gateway:', error)
  }

  // Try to get public IP
  let publicIP: string | null = null
  try {
    const { stdout } = await execAsync('curl -s https://api.ipify.org', { timeout: 5000 })
    publicIP = stdout.trim()
  } catch {
    // Public IP detection failed (no internet or timeout)
  }

  return {
    localIP,
    publicIP,
    gateway,
    subnet,
    macAddress,
    interfaceName
  }
}

/**
 * Scan a single port using native Node.js net module
 */
async function scanPort(
  host: string,
  port: number,
  timeout = 2000
): Promise<'open' | 'closed'> {
  return new Promise((resolve) => {
    const net = require('net')
    const socket = new net.Socket()

    const onError = () => {
      socket.destroy()
      resolve('closed')
    }

    socket.setTimeout(timeout)
    socket.on('error', onError)
    socket.on('timeout', onError)

    socket.connect(port, host, () => {
      socket.destroy()
      resolve('open')
    })
  })
}

/**
 * Scan common ports on a target
 */
export async function scanPorts(
  target: string,
  ports: number[] = COMMON_PORTS.map((p) => p.port)
): Promise<PortScanResult[]> {
  const results: PortScanResult[] = []

  // Scan ports in batches to avoid overwhelming the system
  const batchSize = 10
  for (let i = 0; i < ports.length; i += batchSize) {
    const batch = ports.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (port) => {
        const status = await scanPort(target, port)
        const portInfo = COMMON_PORTS.find((p) => p.port === port)

        return {
          port,
          status,
          service: portInfo?.service || 'Unknown',
          protocol: portInfo?.protocol || 'tcp'
        }
      })
    )

    results.push(...batchResults)
  }

  return results
}

/**
 * Detect vulnerabilities based on open ports
 */
function detectVulnerabilities(openPorts: PortScanResult[]): Array<{
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  port?: number
}> {
  const vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    port?: number
  }> = []

  for (const portResult of openPorts) {
    if (portResult.status !== 'open') continue

    const { port, service } = portResult

    // Check for known vulnerable services
    if (port === 21) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'FTP Service Exposed',
        description: 'FTP transmits data in plaintext. Consider using SFTP or FTPS instead.',
        port
      })
    }

    if (port === 23) {
      vulnerabilities.push({
        severity: 'high',
        title: 'Telnet Service Exposed',
        description:
          'Telnet is highly insecure and transmits credentials in plaintext. Use SSH instead.',
        port
      })
    }

    if (port === 445) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'SMB Service Exposed',
        description:
          'SMB is frequently targeted by ransomware. Ensure it is properly configured and patched.',
        port
      })
    }

    if (port === 3389) {
      vulnerabilities.push({
        severity: 'high',
        title: 'RDP Service Exposed',
        description:
          'RDP is a common attack vector. Enable Network Level Authentication and use strong passwords.',
        port
      })
    }

    if (port === 3306) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'MySQL Service Exposed',
        description: 'Database should not be publicly accessible. Use firewall rules to restrict access.',
        port
      })
    }

    if (port === 5432) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'PostgreSQL Service Exposed',
        description: 'Database should not be publicly accessible. Use firewall rules to restrict access.',
        port
      })
    }

    if (port === 27017) {
      vulnerabilities.push({
        severity: 'high',
        title: 'MongoDB Service Exposed',
        description:
          'MongoDB is often misconfigured without authentication. Ensure authentication is enabled.',
        port
      })
    }

    if (port === 5900) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'VNC Service Exposed',
        description: 'VNC can be vulnerable to attacks. Use strong passwords and consider SSH tunneling.',
        port
      })
    }
  }

  return vulnerabilities
}

/**
 * Discover devices on local network (basic ping sweep)
 */
async function discoverDevices(subnet: string): Promise<
  Array<{
    ip: string
    hostname: string | null
    mac: string | null
    status: 'online' | 'offline'
  }>
> {
  const devices: Array<{
    ip: string
    hostname: string | null
    mac: string | null
    status: 'online' | 'offline'
  }> = []

  // Extract base IP from subnet (e.g., "192.168.1.0/24" -> "192.168.1")
  const baseIP = subnet.split('/')[0].split('.').slice(0, 3).join('.')

  // Scan first 10 IPs for performance (in production, you might scan all 254)
  const promises = []
  for (let i = 1; i <= 10; i++) {
    const ip = `${baseIP}.${i}`
    promises.push(
      (async () => {
        try {
          const platform = os.platform()
          let pingCmd = ''

          if (platform === 'win32') {
            pingCmd = `ping -n 1 -w 1000 ${ip}`
          } else {
            pingCmd = `ping -c 1 -W 1 ${ip}`
          }

          await execAsync(pingCmd)

          // Try to resolve hostname
          let hostname: string | null = null
          try {
            const hostnames = await dns.reverse(ip)
            hostname = hostnames[0] || null
          } catch {
            // Hostname resolution failed
          }

          return {
            ip,
            hostname,
            mac: null, // Would require ARP table access
            status: 'online' as const
          }
        } catch {
          return null
        }
      })()
    )
  }

  const results = await Promise.all(promises)
  return results.filter((d) => d !== null) as Array<{
    ip: string
    hostname: string | null
    mac: string | null
    status: 'online' | 'offline'
  }>
}

/**
 * Perform full network scan
 */
export async function performNetworkScan(target?: string): Promise<NetworkScanResult> {
  const startTime = Date.now()

  // Get network info (this will get local IP by default)
  const networkInfo = await getNetworkInfo()

  // Use local IP as target if not specified
  const scanTarget = target || networkInfo.localIP

  console.log(`[NETWORK SCANNER] Starting scan on ${scanTarget}...`)

  // Scan ports
  const allPorts = await scanPorts(scanTarget)
  const openPorts = allPorts.filter((p) => p.status === 'open')

  console.log(`[NETWORK SCANNER] Found ${openPorts.length} open ports`)

  // Detect vulnerabilities
  const vulnerabilities = detectVulnerabilities(openPorts)

  console.log(`[NETWORK SCANNER] Detected ${vulnerabilities.length} potential vulnerabilities`)

  // Discover devices on network (if scanning local network)
  let devices: Array<{
    ip: string
    hostname: string | null
    mac: string | null
    status: 'online' | 'offline'
  }> = []

  if (!target || target === networkInfo.localIP) {
    console.log('[NETWORK SCANNER] Discovering devices on local network...')
    devices = await discoverDevices(networkInfo.subnet)
    console.log(`[NETWORK SCANNER] Found ${devices.length} online devices`)
  }

  // Generate summary
  const summary = `Scan completed: ${openPorts.length} open ports found, ${vulnerabilities.length} potential vulnerabilities detected, ${devices.length} devices discovered.`

  const duration = Date.now() - startTime

  return {
    id: `scan-${Date.now()}`,
    target: scanTarget,
    networkInfo,
    openPorts,
    vulnerabilities,
    devices,
    summary,
    timestamp: new Date().toISOString(),
    duration
  }
}

/**
 * Quick network health check
 */
export async function quickNetworkCheck(): Promise<{
  connected: boolean
  localIP: string
  publicIP: string | null
  gateway: string | null
  dnsWorking: boolean
}> {
  const networkInfo = await getNetworkInfo()

  // Test DNS
  let dnsWorking = false
  try {
    await dns.resolve4('google.com')
    dnsWorking = true
  } catch {
    // DNS not working
  }

  return {
    connected: networkInfo.publicIP !== null || dnsWorking,
    localIP: networkInfo.localIP,
    publicIP: networkInfo.publicIP,
    gateway: networkInfo.gateway,
    dnsWorking
  }
}

/**
 * Get network interface details
 */
export function getNetworkInterfaces(): Array<{
  name: string
  addresses: Array<{
    address: string
    family: string
    internal: boolean
    mac: string
  }>
}> {
  const interfaces = os.networkInterfaces()
  const result: Array<{
    name: string
    addresses: Array<{
      address: string
      family: string
      internal: boolean
      mac: string
    }>
  }> = []

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue

    result.push({
      name,
      addresses: addresses.map((addr) => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
        mac: addr.mac
      }))
    })
  }

  return result
}
