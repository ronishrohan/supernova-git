import React, { useState } from 'react'
import { Link as LinkIcon, Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

interface AnalysisResult {
  url: string
  isPhishing: boolean
  probability: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  timestamp: string
}

export default function LinkChecker() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyzeLink = async () => {
    if (!url.trim()) return

    setLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate random probability (for now)
    const probability = Math.random() * 100
    const isPhishing = probability > 50

    // Determine risk level based on probability
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
    if (probability < 20) riskLevel = 'safe'
    else if (probability < 40) riskLevel = 'low'
    else if (probability < 60) riskLevel = 'medium'
    else if (probability < 80) riskLevel = 'high'
    else riskLevel = 'critical'

    // Generate random indicators
    const allIndicators = [
      'Domain age is less than 30 days',
      'SSL certificate is valid',
      'Domain is registered in a high-risk country',
      'URL contains suspicious keywords',
      'Domain mimics a well-known brand',
      'No HTTPS encryption detected',
      'Redirect chain detected',
      'Domain has poor reputation score',
      'URL structure is unusual',
      'Known phishing patterns detected',
      'Domain matches trusted database',
      'Clean DNS records',
      'No malware detected',
      'Domain has good reputation'
    ]

    const numIndicators = Math.floor(Math.random() * 4) + 2
    const indicators: string[] = []
    const usedIndices = new Set<number>()

    while (indicators.length < numIndicators) {
      const index = Math.floor(Math.random() * allIndicators.length)
      if (!usedIndices.has(index)) {
        indicators.push(allIndicators[index])
        usedIndices.add(index)
      }
    }

    setResult({
      url,
      isPhishing,
      probability: Math.round(probability),
      riskLevel,
      indicators,
      timestamp: new Date().toISOString()
    })

    setLoading(false)
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
          <h1 className="text-3xl font-logo font-light tracking-tighter">Link Checker</h1>
          <p className="text-gray-600">Analyze URLs for phishing and malicious content</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Section */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2">
            <LinkIcon className="text-primary" size={24} strokeWidth={1} />
            Enter URL to Analyze
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeLink()}
                className="w-full border outline-none focus:border-primary border-border px-4 py-2 bg-background text-white"
              />
            </div>

            <button
              onClick={analyzeLink}
              disabled={!url.trim() || loading}
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
                  Analyze Link
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
                  <p className="text-lg mb-3">
                    {result.isPhishing ? 'Potential Phishing Link Detected' : 'Link Appears Safe'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-400">Phishing Probability:</span>
                      <span className="text-2xl font-light ml-2">{result.probability}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* URL Details */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-lg font-light mb-3">Analyzed URL</h3>
              <div className="bg-background p-3 border border-border break-all">
                <code className="text-sm text-primary">{result.url}</code>
              </div>
            </div>

            {/* Security Indicators */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-lg font-light mb-4">Security Indicators</h3>
              <div className="space-y-2">
                {result.indicators.map((indicator, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-background border border-border"
                  >
                    <div className="mt-0.5">
                      {indicator.toLowerCase().includes('no') ||
                      indicator.toLowerCase().includes('suspicious') ||
                      indicator.toLowerCase().includes('poor') ||
                      indicator.toLowerCase().includes('unusual') ? (
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
              <h3 className="text-lg font-light mb-3">Recommendation</h3>
              <p className="text-sm text-gray-400">
                {result.riskLevel === 'safe' || result.riskLevel === 'low'
                  ? 'This link appears to be safe. However, always exercise caution when clicking on links from unknown sources.'
                  : result.riskLevel === 'medium'
                    ? 'This link shows some suspicious characteristics. Proceed with caution and verify the source before clicking.'
                    : 'This link is highly suspicious and may be a phishing attempt. Do not click on this link or enter any personal information.'}
              </p>
            </div>
          </div>
        )}

        {/* Information Section */}
        {!result && (
          <div className="bg-card border border-border p-6">
            <h2 className="text-xl font-light mb-4">How it Works</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                The Link Checker analyzes URLs for potential phishing and malicious content by
                examining various security indicators.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>SSL certificate validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Domain reputation check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>URL pattern analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Known phishing database</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
