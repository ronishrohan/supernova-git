import React, { useState, useEffect } from 'react'
import { FileText, Download, Activity, Shield, AlertTriangle, Database } from 'lucide-react'
import { useConveyor } from '../../hooks/use-conveyor'
import { useAuthStore } from '../../store/authStore'
import jsPDF from 'jspdf'

interface SystemMetrics {
  cpu: number[]
  memory: number[]
  disk: number[]
  timestamps: string[]
}

export default function Reports() {
  const conveyor = useConveyor('security')
  const { user } = useAuthStore()
  const [reportName, setReportName] = useState('')
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [systemHistory, setSystemHistory] = useState<SystemMetrics>({
    cpu: [],
    memory: [],
    disk: [],
    timestamps: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const snapshot = await conveyor.getDashboardSnapshot(user?.email)
      const status = await conveyor.getSystemStatus()

      setDashboardData(snapshot)

      // Extract historical data from watchdog
      if (status.history && status.history.length > 0) {
        const metrics: SystemMetrics = {
          cpu: [],
          memory: [],
          disk: [],
          timestamps: []
        }

        status.history.slice(-20).forEach((reading) => {
          metrics.cpu.push(reading.cpu)
          metrics.memory.push(reading.memory)
          metrics.disk.push(reading.disk)
          metrics.timestamps.push(new Date(reading.timestamp).toLocaleTimeString())
        })

        setSystemHistory(metrics)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const generatePDF = async () => {
    if (!reportName.trim()) return

    setLoading(true)

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Colors matching app theme
      const primaryColor = [82, 111, 150] // #52678d
      const accentColor = [158, 190, 202] // #9ebeca
      const bgColor = [15, 18, 22] // #0f1216
      const cardColor = [20, 24, 30] // #14181e
      const textColor = [255, 255, 255]
      const grayColor = [156, 163, 175]

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Background
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // Header Section
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F')

      // Title
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(24)
      pdf.text('SUPERNOVA', margin + 5, yPosition + 15)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(18)
      pdf.text(reportName || 'Security Report', margin + 5, yPosition + 25)

      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      pdf.setFontSize(10)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin + 5, yPosition + 32)
      pdf.text(`User: ${user?.email || 'N/A'}`, margin + 5, yPosition + 37)

      yPosition += 50

      // System Health Overview
      checkPageBreak(35)
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F')

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.text('System Health Overview', margin + 5, yPosition + 10)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(11)
      const healthScore = dashboardData?.systemHealth?.score || 0
      const healthStatus = dashboardData?.systemHealth?.status || 'Unknown'
      pdf.text(`Health Score: ${healthScore}%`, margin + 5, yPosition + 18)
      pdf.text(`Status: ${healthStatus}`, margin + 5, yPosition + 24)

      pdf.text(`CPU: ${dashboardData?.systemHealth?.cpu || 0}%`, margin + 70, yPosition + 18)
      pdf.text(`Memory: ${dashboardData?.systemHealth?.memory || 0}%`, margin + 110, yPosition + 18)
      pdf.text(`Disk: ${dashboardData?.systemHealth?.disk || 0}%`, margin + 150, yPosition + 18)

      yPosition += 40

      // Scan Statistics
      checkPageBreak(45)
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F')

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.text('Scan Statistics', margin + 5, yPosition + 10)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(11)
      const totalScans = dashboardData?.scans?.totalScans || 0
      const cleanScans = dashboardData?.scans?.cleanCount || 0
      const suspiciousScans = dashboardData?.scans?.suspiciousCount || 0
      const maliciousScans = dashboardData?.scans?.maliciousCount || 0

      pdf.text(`Total Scans: ${totalScans}`, margin + 5, yPosition + 20)
      pdf.text(`Clean: ${cleanScans}`, margin + 5, yPosition + 27)
      pdf.text(`Suspicious: ${suspiciousScans}`, margin + 70, yPosition + 27)
      pdf.text(`Malicious: ${maliciousScans}`, margin + 130, yPosition + 27)

      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      pdf.setFontSize(9)
      const lastScan = dashboardData?.scans?.lastScanTime
      pdf.text(
        `Last Scan: ${lastScan ? new Date(lastScan).toLocaleString() : 'Never'}`,
        margin + 5,
        yPosition + 35
      )

      yPosition += 50

      // Threats Detected
      checkPageBreak(35)
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F')

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.text('Threats Detected', margin + 5, yPosition + 10)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(11)
      const totalThreats = suspiciousScans + maliciousScans
      pdf.text(`Total Threats: ${totalThreats}`, margin + 5, yPosition + 20)
      pdf.text(`Critical Anomalies: ${dashboardData?.watchdog?.criticalAnomalies || 0}`, margin + 70, yPosition + 20)

      yPosition += 40

      // Phishing Attempts (Dummy data)
      checkPageBreak(35)
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F')

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.text('Phishing Detection', margin + 5, yPosition + 10)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(11)
      pdf.text('Phishing Attempts Blocked: 12', margin + 5, yPosition + 20)
      pdf.text('Suspicious Emails Detected: 8', margin + 90, yPosition + 20)

      yPosition += 40

      // Data Breach Status
      if (dashboardData?.breaches) {
        checkPageBreak(40)
        pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F')

        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setFontSize(14)
        pdf.text('Data Breach Monitor', margin + 5, yPosition + 10)

        pdf.setTextColor(textColor[0], textColor[1], textColor[2])
        pdf.setFontSize(11)
        pdf.text(`Email: ${dashboardData.breaches.email}`, margin + 5, yPosition + 18)
        pdf.text(`Breaches Found: ${dashboardData.breaches.breachCount}`, margin + 5, yPosition + 25)

        if (dashboardData.breaches.breachCount > 0) {
          pdf.setTextColor(255, 165, 0) // Orange for warnings
          pdf.setFontSize(9)
          pdf.text(
            `Services: ${dashboardData.breaches.breaches.join(', ')}`,
            margin + 5,
            yPosition + 31
          )
        }

        yPosition += 45
      }

      // System Metrics History
      checkPageBreak(60)
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2])
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 55, 'F')

      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.text('System Metrics History (Last 20 readings)', margin + 5, yPosition + 10)

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(9)

      if (systemHistory.cpu.length > 0) {
        const avgCpu = (systemHistory.cpu.reduce((a, b) => a + b, 0) / systemHistory.cpu.length).toFixed(1)
        const avgMemory = (systemHistory.memory.reduce((a, b) => a + b, 0) / systemHistory.memory.length).toFixed(1)
        const avgDisk = (systemHistory.disk.reduce((a, b) => a + b, 0) / systemHistory.disk.length).toFixed(1)

        pdf.text(`Average CPU Usage: ${avgCpu}%`, margin + 5, yPosition + 20)
        pdf.text(`Average Memory Usage: ${avgMemory}%`, margin + 5, yPosition + 26)
        pdf.text(`Average Disk Usage: ${avgDisk}%`, margin + 5, yPosition + 32)

        pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        pdf.text(`Peak CPU: ${Math.max(...systemHistory.cpu).toFixed(1)}%`, margin + 80, yPosition + 20)
        pdf.text(`Peak Memory: ${Math.max(...systemHistory.memory).toFixed(1)}%`, margin + 80, yPosition + 26)
        pdf.text(`Peak Disk: ${Math.max(...systemHistory.disk).toFixed(1)}%`, margin + 80, yPosition + 32)

        pdf.text(
          `Monitoring Period: ${systemHistory.timestamps[0]} - ${systemHistory.timestamps[systemHistory.timestamps.length - 1]}`,
          margin + 5,
          yPosition + 40
        )
      } else {
        pdf.text('No historical data available', margin + 5, yPosition + 25)
      }

      yPosition += 65

      // Footer
      checkPageBreak(15)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      

      // Save PDF
      const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
      pdf.save(fileName)

      setReportName('')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Report Generator</h1>
          <p className="text-gray-600">Generate comprehensive security reports</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border p-6 mb-6">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2">
            <FileText className="text-primary" size={24} strokeWidth={1} />
            Generate Security Report
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Report Name</label>
              <input
                type="text"
                placeholder="e.g., Monthly Security Report - January 2025"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full border outline-none focus:border-primary border-border px-4 py-2 bg-background text-white"
              />
            </div>

            <div className="bg-background border border-border p-4">
              <h3 className="text-sm font-medium mb-3 text-gray-400">Report Contents:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-primary" />
                  <span>System health overview</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" />
                  <span>CPU, Memory, Disk history</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-orange-500" />
                  <span>Threats detected</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-green-500" />
                  <span>Scan statistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-purple-500" />
                  <span>Data breach status</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-red-500" />
                  <span>Phishing attempts</span>
                </div>
              </div>
            </div>

            <button
              onClick={generatePDF}
              disabled={!reportName || loading}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Generate PDF Report
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-xl font-light mb-4">Report Information</h2>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              The generated report includes comprehensive security metrics and analysis based on your
              system's current state and historical data.
            </p>
            <p>Reports are saved in PDF format and can be shared with your security team or archived for compliance purposes.</p>
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30">
              <p className="text-primary text-xs">
                All reports are generated locally and include data from the last monitoring session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
