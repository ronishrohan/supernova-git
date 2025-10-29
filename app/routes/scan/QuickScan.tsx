import React, { useState, useEffect } from 'react'
import { Radar, Shield, AlertTriangle, CheckCircle, Network, Clock } from 'lucide-react'
import { useConveyor } from '../../hooks/use-conveyor'

interface ScanResult {
  id: string
  target: string
  networkInfo: {
    localIP: string
    publicIP: string | null
    gateway: string | null
  }
  openPorts: Array<{
    port: number
    status: string
    service: string
    protocol: string
  }>
  vulnerabilities: Array<{
    severity: string
    title: string
    description: string
    port?: number
  }>
  devices: Array<{
    ip: string
    hostname: string | null
    status: string
  }>
  summary: string
  timestamp: string
  duration: number
}

export default function QuickScan() {
  const conveyor = useConveyor('security')
  const [scanning, setScanning] = useState(false)
  const [target, setTarget] = useState('')
  const [localIP, setLocalIP] = useState('Detecting...')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  useEffect(() => {
    loadNetworkInfo()
  }, [])

  const loadNetworkInfo = async () => {
    try {
      const info = await conveyor.getNetworkInfo()
      setLocalIP(info.localIP)
      setTarget(info.localIP) // Set local IP as default target
    } catch (error) {
      console.error('Error loading network info:', error)
      setLocalIP('Unknown')
    }
  }

  const handleScan = async () => {
    setScanning(true)
    setScanResult(null)

    try {
      const result = await conveyor.performNetworkScan(target || undefined)
      setScanResult(result)
    } catch (error) {
      console.error('Scan error:', error)
      alert('Scan failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setScanning(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500'
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500'
    }
  }

  return (
    <div className="size-full p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Network Scanner</h1>
          <p className="text-gray-600">Scan your network for open ports and vulnerabilities</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Network Info Card */}
        <div className="bg-card border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Network className="text-primary" size={24} />
            <div>
              <h2 className="text-lg font-medium">Your Network</h2>
              <p className="text-sm text-gray-600">Local IP: {localIP}</p>
            </div>
          </div>
        </div>

        {/* Scan Input */}
        <div className="bg-card border border-border p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Radar className="text-primary" size={32} strokeWidth={1} />
            <div>
              <h2 className="text-xl font-light">Quick Scan</h2>
              <p className="text-sm text-gray-600">
                Scan your system or enter a custom target (leave empty to scan your local IP)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder={`Target IP or domain (default: ${localIP})`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex-1 border outline-none focus:border-primary border-border bg-background px-4 py-2"
              disabled={scanning}
            />

            <button
              onClick={handleScan}
              disabled={scanning}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>

        {/* Scanning Progress */}
        {scanning && (
          <div className="bg-card border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <Radar className="text-primary animate-spin" size={32} />
              <div className="flex-1">
                <p className="text-lg mb-2">Scanning {target || localIP}...</p>
                <div className="h-2 bg-border overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Scanning ports, detecting services, analyzing vulnerabilities...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-light mb-2">Scan Complete</h2>
                  <p className="text-gray-600">{scanResult.summary}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Clock size={14} />
                    {(scanResult.duration / 1000).toFixed(2)}s
                  </p>
                  <p>{new Date(scanResult.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-background p-4 border border-border">
                  <p className="text-xs text-gray-600 mb-1">Open Ports</p>
                  <p className="text-3xl font-light">
                    {scanResult.openPorts.filter((p) => p.status === 'open').length}
                  </p>
                </div>
                <div className="bg-background p-4 border border-border">
                  <p className="text-xs text-gray-600 mb-1">Vulnerabilities</p>
                  <p className="text-3xl font-light">{scanResult.vulnerabilities.length}</p>
                </div>
                <div className="bg-background p-4 border border-border">
                  <p className="text-xs text-gray-600 mb-1">Devices Found</p>
                  <p className="text-3xl font-light">{scanResult.devices.length}</p>
                </div>
              </div>
            </div>

            {/* Vulnerabilities */}
            {scanResult.vulnerabilities.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-light mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={24} />
                  Vulnerabilities Detected
                </h3>
                <div className="space-y-3">
                  {scanResult.vulnerabilities.map((vuln, idx) => (
                    <div
                      key={idx}
                      className={`border p-4 ${getSeverityColor(vuln.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{vuln.title}</h4>
                        <span className="text-xs uppercase tracking-wider">{vuln.severity}</span>
                      </div>
                      <p className="text-sm text-gray-400">{vuln.description}</p>
                      {vuln.port && (
                        <p className="text-xs text-gray-600 mt-2">Port: {vuln.port}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Ports */}
            {scanResult.openPorts.filter((p) => p.status === 'open').length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-light mb-4 flex items-center gap-2">
                  <Network className="text-primary" size={24} />
                  Open Ports
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {scanResult.openPorts
                    .filter((p) => p.status === 'open')
                    .map((port, idx) => (
                      <div key={idx} className="border border-border p-3 bg-background">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg">{port.port}</span>
                          <span className="text-xs text-gray-600 uppercase">{port.protocol}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{port.service}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Devices */}
            {scanResult.devices.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-light mb-4 flex items-center gap-2">
                  <Shield className="text-green-500" size={24} />
                  Network Devices
                </h3>
                <div className="space-y-2">
                  {scanResult.devices.map((device, idx) => (
                    <div key={idx} className="border border-border p-3 bg-background flex items-center justify-between">
                      <div>
                        <p className="font-mono">{device.ip}</p>
                        {device.hostname && (
                          <p className="text-sm text-gray-600">{device.hostname}</p>
                        )}
                      </div>
                      <span className="text-xs text-green-500 uppercase">{device.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean Result */}
            {scanResult.vulnerabilities.length === 0 && (
              <div className="bg-card border border-green-500 p-8 text-center">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
                <h3 className="text-2xl font-light mb-2">No Vulnerabilities Detected</h3>
                <p className="text-gray-600">Your system appears secure based on this scan.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
