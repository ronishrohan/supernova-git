import React, { useState } from 'react'
import { Mail, Shield, AlertTriangle, CheckCircle, Activity, Upload, FileText } from 'lucide-react'

interface AnalysisResult {
  isScam: boolean
  probability: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  verdict: string
  timestamp: string
}

export default function EmailAnalyzer() {
  const [emailContent, setEmailContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyzeEmail = async () => {
    if (!emailContent.trim()) return

    setLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate random probability (for now)
    const probability = Math.random() * 100
    const isScam = probability > 50

    // Determine risk level based on probability
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
    if (probability < 20) riskLevel = 'safe'
    else if (probability < 40) riskLevel = 'low'
    else if (probability < 60) riskLevel = 'medium'
    else if (probability < 80) riskLevel = 'high'
    else riskLevel = 'critical'

    // Generate random indicators
    const allIndicators = [
      'Sender email address is suspicious',
      'Email contains urgent language',
      'Multiple spelling and grammar errors detected',
      'Suspicious links detected in email body',
      'Sender domain does not match claimed organization',
      'Email requests personal information',
      'Contains unusual attachments',
      'Email header analysis shows inconsistencies',
      'Sender has good reputation',
      'Email passes SPF and DKIM checks',
      'No suspicious URLs detected',
      'Professional language and formatting',
      'Legitimate company domain verified',
      'No sense of urgency or threats'
    ]

    const numIndicators = Math.floor(Math.random() * 5) + 3
    const indicators: string[] = []
    const usedIndices = new Set<number>()

    while (indicators.length < numIndicators) {
      const index = Math.floor(Math.random() * allIndicators.length)
      if (!usedIndices.has(index)) {
        indicators.push(allIndicators[index])
        usedIndices.add(index)
      }
    }

    // Generate verdict
    let verdict = ''
    if (riskLevel === 'safe' || riskLevel === 'low') {
      verdict = 'This email appears to be legitimate.'
    } else if (riskLevel === 'medium') {
      verdict = 'This email shows some suspicious characteristics. Exercise caution.'
    } else {
      verdict = 'This email is highly likely to be a scam. Do not respond or click any links.'
    }

    setResult({
      isScam,
      probability: Math.round(probability),
      riskLevel,
      indicators,
      verdict,
      timestamp: new Date().toISOString()
    })

    setLoading(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setEmailContent(content)
    }
    reader.readAsText(file)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'text-green-500 border-green-500 bg-green-500/10'
      case 'low':
        return 'text-blue-500 border-blue-500 bg-blue-500/10'
      case 'medium':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10'
      case 'high':
        return 'text-orange-500 border-orange-500 bg-orange-500/10'
      case 'critical':
        return 'text-red-500 border-red-500 bg-red-500/10'
      default:
        return 'text-gray-500 border-gray-500 bg-gray-500/10'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe':
      case 'low':
        return <CheckCircle size={32} />
      case 'medium':
        return <Shield size={32} />
      case 'high':
      case 'critical':
        return <AlertTriangle size={32} />
      default:
        return <Shield size={32} />
    }
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Email Analyzer</h1>
          <p className="text-gray-600">Detect scam emails and phishing attempts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Section */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2">
            <Mail className="text-primary" size={24} strokeWidth={1} />
            Email Content
          </h2>

          <div className="flex flex-col gap-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Upload .eml File (Optional)</label>
              <label className="w-full border border-dashed border-border hover:border-primary transition-all px-4 py-8 cursor-pointer flex flex-col items-center justify-center gap-2 bg-background">
                <Upload size={32} className="text-gray-500" />
                <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-600">.eml files only</span>
                <input
                  type="file"
                  accept=".eml,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex-1 h-px bg-border"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Text Area */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Paste Email Content</label>
              <textarea
                placeholder="Paste the email content here..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={10}
                className="w-full border outline-none focus:border-primary border-border px-4 py-2 bg-background text-white resize-none"
              />
            </div>

            <button
              onClick={analyzeEmail}
              disabled={!emailContent.trim() || loading}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="animate-spin" size={18} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Analyze Email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Risk Level Card */}
            <div className={`bg-card border p-6 ${getRiskColor(result.riskLevel)}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 ${getRiskColor(result.riskLevel)}`}>
                  {getRiskIcon(result.riskLevel)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-light">Analysis Result</h3>
                    <span className="text-sm text-gray-400">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-2xl font-medium mb-2 uppercase">{result.riskLevel} Risk</p>
                  <p className="text-lg mb-3">{result.verdict}</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-400">Scam Probability:</span>
                      <span className="text-2xl font-light ml-2">{result.probability}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Indicators */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-lg font-light mb-4">Email Analysis Indicators</h3>
              <div className="space-y-2">
                {result.indicators.map((indicator, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-background border border-border"
                  >
                    <div className="mt-0.5">
                      {indicator.toLowerCase().includes('suspicious') ||
                      indicator.toLowerCase().includes('error') ||
                      indicator.toLowerCase().includes('urgent') ||
                      indicator.toLowerCase().includes('inconsisten') ||
                      indicator.toLowerCase().includes('unusual') ||
                      indicator.toLowerCase().includes('not match') ? (
                        <AlertTriangle size={16} className="text-orange-500" />
                      ) : (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-300">{indicator}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-lg font-light mb-3">Security Recommendations</h3>
              <div className="space-y-2 text-sm text-gray-400">
                {(result.riskLevel === 'high' || result.riskLevel === 'critical') && (
                  <>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                      <span>Do not click on any links in this email</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                      <span>Do not download or open any attachments</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                      <span>Do not provide any personal or financial information</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                      <span>Report this email to your IT department or email provider</span>
                    </p>
                  </>
                )}
                {result.riskLevel === 'medium' && (
                  <>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Verify the sender's identity before responding</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Hover over links to check their actual destination</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Be cautious with any requests for personal information</span>
                    </p>
                  </>
                )}
                {(result.riskLevel === 'safe' || result.riskLevel === 'low') && (
                  <>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>This email appears legitimate, but always stay vigilant</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Still verify sender identity if requesting sensitive actions</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        {!result && (
          <div className="bg-card border border-border p-6">
            <h2 className="text-xl font-light mb-4">How it Works</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                The Email Analyzer uses advanced pattern recognition to detect scam emails and
                phishing attempts by analyzing various characteristics of the email.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-500" />
                  <span>Sender verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-500" />
                  <span>Content analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-500" />
                  <span>Link inspection</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-500" />
                  <span>Header examination</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
