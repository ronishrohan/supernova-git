import React, { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Palette, Database } from 'lucide-react'

export default function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [autoScan, setAutoScan] = useState(false)
  const [theme, setTheme] = useState('dark')

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Settings</h1>
          <p className="text-gray-600">Configure your application preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Notifications Section */}
          <div className="bg-card border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-primary" size={24} strokeWidth={1} />
              <h2 className="text-xl font-light">Notifications</h2>
            </div>
            <div className="flex items-center justify-between py-3 ">
              <div>
                <p className="font-light">Enable Notifications</p>
                <p className="text-sm text-gray-600">Receive alerts for scans and security events</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-all ${notifications ? 'bg-primary' : 'bg-border'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-all ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-card border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-primary" size={24} strokeWidth={1} />
              <h2 className="text-xl font-light">Security</h2>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-light">Auto-Scan on Startup</p>
                <p className="text-sm text-gray-600">Automatically run quick scan when application starts</p>
              </div>
              <button
                onClick={() => setAutoScan(!autoScan)}
                className={`w-12 h-6 rounded-full transition-all ${autoScan ? 'bg-primary' : 'bg-border'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-all ${
                    autoScan ? 'translate-x-6' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
            <div className="py-3">
              <p className="font-light mb-2">Session Timeout</p>
              <select className="w-full border outline-none focus:border-primary border-border px-4 py-2 bg-background">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          {/* Data Section */}
          <div className="bg-card border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="text-primary" size={24} strokeWidth={1} />
              <h2 className="text-xl font-light">Data Management</h2>
            </div>
            <div className="flex flex-col gap-3">
              <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 text-left">
                Export All Data
              </button>
              <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 text-left">
                Clear Scan History
              </button>
              <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-red-600/60 to-red-600/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 text-left hover:from-red-600 hover:to-red-600/60">
                Delete All Data
              </button>
            </div>
          </div>

          {/* Save Button */}
        </div>
      </div>
    </div>
  )
}
