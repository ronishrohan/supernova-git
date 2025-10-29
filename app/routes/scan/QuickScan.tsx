import React, { useState } from 'react'
import { Radar } from 'lucide-react'

export default function QuickScan() {
  const [scanning, setScanning] = useState(false)
  const [target, setTarget] = useState('')

  const handleScan = () => {
    setScanning(true)
    // Simulate scan
    setTimeout(() => {
      setScanning(false)
    }, 3000)
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Quick Scan</h1>
          <p className="text-gray-600">Perform a rapid security scan</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-20">
        <div className="flex flex-col gap-6 items-center">
          <div className="bg-card border border-border p-8 w-full flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-4">
              <Radar className="text-primary" size={32} strokeWidth={1} />
              <div>
                <h2 className="text-xl font-light">Network Scanner</h2>
                <p className="text-sm text-gray-600">Scan targets for vulnerabilities</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Target IP or Domain (e.g., 192.168.1.1)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="border outline-none focus:border-primary border-border px-4 py-2"
            />

            <button
              onClick={handleScan}
              disabled={scanning || !target}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>

          {scanning && (
            <div className="bg-card border border-border p-6 w-full">
              <div className="flex items-center gap-3">
                <Radar className="text-primary animate-pulse" size={24} strokeWidth={1} />
                <div>
                  <p className="text-sm text-gray-600">Scanning {target}...</p>
                  <div className="mt-2 h-1 w-full bg-border overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
