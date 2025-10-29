import React, { useState } from 'react'
import { FileText, Download, Calendar } from 'lucide-react'

interface Report {
  id: number
  name: string
  date: string
  type: string
}

export default function Reports() {
  const [reports] = useState<Report[]>([
    { id: 1, name: 'Security Scan Report - October', date: '2025-10-25', type: 'Vulnerability Scan' },
    { id: 2, name: 'Network Analysis Report', date: '2025-10-20', type: 'Network Scan' },
    { id: 3, name: 'Compliance Audit Report', date: '2025-10-15', type: 'Audit' },
  ])

  const [reportType, setReportType] = useState('vulnerability')
  const [reportName, setReportName] = useState('')

  const handleGenerate = () => {
    console.log('Generating report:', reportType, reportName)
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Report Generator</h1>
          <p className="text-gray-600">Generate and export reports</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border p-6 mb-6">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2">
            <FileText className="text-primary" size={24} strokeWidth={1} />
            Create New Report
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Report Name</label>
              <input
                type="text"
                placeholder="Enter report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full border outline-none focus:border-primary border-border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border outline-none focus:border-primary border-border px-4 py-2 bg-background"
              >
                <option value="vulnerability">Vulnerability Scan</option>
                <option value="network">Network Analysis</option>
                <option value="audit">Compliance Audit</option>
                <option value="penetration">Penetration Test</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!reportName}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Report
            </button>
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-xl font-light mb-4">Recent Reports</h2>
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-border hover:border-primary transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={20} strokeWidth={1} />
                  <div>
                    <h3 className="font-light">{report.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} strokeWidth={1} />
                      {report.date} • {report.type}
                    </div>
                  </div>
                </div>
                <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 flex items-center gap-2">
                  <Download size={16} strokeWidth={1} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
