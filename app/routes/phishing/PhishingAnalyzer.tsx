import React, { useState } from 'react'
import { Link2, Shield, AlertTriangle, CheckCircle, Activity, FileText, Globe } from 'lucide-react'
import { useConveyor } from '@/app/hooks/use-conveyor'

interface PhishingResult {
  label: 'safe' | 'suspicious' | 'malicious'
  score: number
  probabilities: Record<string, number>
  explanation: string
  features: string[]
}

export default function PhishingAnalyzer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PhishingResult | null>(null)
  const conveyor = useConveyor()

  const analyzeUrl = async () => {
    if (!url.trim()) return

    setLoading(true)

    try {
      const analysis = await conveyor.security.analyzeEmail(url)
      setResult(analysis)
    } catch (error) {
      console.error('URL phishing analysis error:', error)
      // Show error or fallback
    }

    setLoading(false)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'text-green-500 border-green-500 bg-green-500/10'
      case 'suspicious':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10'
      case 'malicious':
        return 'text-red-500 border-red-500 bg-red-500/10'
      default:
        return 'text-gray-500 border-gray-500 bg-gray-500/10'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle size={32} />
      case 'suspicious':
        return <Shield size={32} />
      case 'malicious':
        return <AlertTriangle size={32} />
      default:
        return <Shield size={32} />
    }
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">URL Phishing Analyzer</h1>
          <p className="text-gray-600">Advanced AI-powered URL phishing detection</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Section */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2">
            <Link2 className="text-primary" size={24} strokeWidth={1} />
            URL to Analyze
          </h2>

          <div className="flex flex-col gap-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Enter URL</label>
              <input
                type="text"
                placeholder="https://example.com or paste any suspicious URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border outline-none focus:border-primary border-border px-4 py-3 bg-background text-white"
              />
            </div>

            <button
              onClick={analyzeUrl}
              disabled={!url.trim() || loading}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="animate-spin" size={18} />
                  Analyzing URL with AI...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Analyze URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Risk Level Card */}
            <div className={`bg-card border p-6 ${getRiskColor(result.label)}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 ${getRiskColor(result.label)}`}>
                  {getRiskIcon(result.label)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-light">Analysis Result</h3>
                  </div>
                  <p className="text-2xl font-medium mb-2 uppercase">{result.label}</p>
                  <p className="text-lg mb-3">{result.explanation}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-400">Phishing Risk Score:</span>
                      <span className="text-2xl font-light ml-2">{Math.round(result.score)}/100</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 break-all">
                    <span className="font-medium">Analyzed URL: </span>{url}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Safe</div>
                      <div className="text-lg font-light text-green-500">
                        {Math.round((result.probabilities.safe || 0) * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Suspicious</div>
                      <div className="text-lg font-light text-yellow-500">
                        {Math.round((result.probabilities.suspicious || 0) * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Malicious</div>
                      <div className="text-lg font-light text-red-500">
                        {Math.round((result.probabilities.malicious || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detected Features */}
            {result.features && result.features.length > 0 && (
              <div className="bg-card border border-border p-6">
                <h3 className="text-lg font-light mb-4">Detected Indicators</h3>
                <div className="space-y-2">
                  {result.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-background border border-border"
                    >
                      <div className="mt-0.5">
                        <AlertTriangle size={16} className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-200">{feature}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-lg font-light mb-3">Security Recommendations</h3>
              <div className="space-y-2 text-sm text-gray-400">
                {result.label === 'malicious' && (
                  <>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Do not visit this URL or enter any information</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Do not download anything from this site</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Do not provide any personal or financial information</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Report this URL to your IT department or security team</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Block this domain in your security settings</span>
                    </p>
                  </>
                )}
                {result.label === 'suspicious' && (
                  <>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Verify the website's authenticity before proceeding</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Check for HTTPS and valid SSL certificates</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Be cautious with any requests for personal information</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Shield size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                      <span>Contact the organization directly using official contact methods</span>
                    </p>
                  </>
                )}
                {result.label === 'safe' && (
                  <>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>This URL appears legitimate, but always stay vigilant</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Verify the domain matches the official website</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Check for secure HTTPS connection before entering data</span>
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
                The URL Phishing Analyzer uses Google's Gemini AI to detect phishing URLs and suspicious
                websites by analyzing various characteristics with advanced pattern recognition.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-green-500" />
                  <span>AI-powered URL analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-500" />
                  <span>Domain reputation check</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-500" />
                  <span>Pattern detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-green-500" />
                  <span>Suspicious indicator analysis</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
