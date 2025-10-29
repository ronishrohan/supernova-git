import { GoogleGenerativeAI } from '@google/generative-ai'

export interface EmailAnalysisIndicator {
  name: string
  severity: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface EmailAnalysisResult {
  isScam: boolean
  probability: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  indicators: EmailAnalysisIndicator[]
  verdict: string
  timestamp: string
}

/**
 * Analyze email content using Gemini AI
 */
export async function analyzeEmail(emailContent: string): Promise<EmailAnalysisResult> {
  try {
    const apiKey = "AIzaSyBt-AEd1VmqH7SmG1m1ulJcMmHBbryt89Y"

    if (!apiKey) {
      throw new Error('Gemini API key is not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemPrompt = `You are an expert email security analyst specializing in detecting phishing, scam, and malicious emails.

Analyze the provided email content and return a JSON response with the following structure:
{
  "isScam": boolean,
  "probability": number (0-100),
  "riskLevel": "safe" | "low" | "medium" | "high" | "critical",
  "indicators": [
    {
      "name": "indicator name",
      "severity": "safe" | "low" | "medium" | "high" | "critical",
      "description": "detailed description"
    }
  ],
  "verdict": "A brief summary of the analysis (2-3 sentences)"
}

Analyze the email for:
- Suspicious sender addresses
- Urgent/threatening language
- Requests for sensitive information
- Grammar and spelling errors
- Suspicious links or attachments
- Impersonation attempts
- Too-good-to-be-true offers
- Generic greetings
- Mismatched URLs
- Social engineering tactics

Provide specific, actionable indicators with severity levels. Return ONLY valid JSON, no other text.`

    const fullPrompt = `${systemPrompt}\n\nEmail Content:\n${emailContent}`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '')
    }

    const analysis = JSON.parse(jsonText)

    return {
      isScam: analysis.isScam,
      probability: Math.round(analysis.probability),
      riskLevel: analysis.riskLevel,
      indicators: analysis.indicators,
      verdict: analysis.verdict,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Email analysis error:', error)

    // Fallback to basic analysis if Gemini fails
    return generateFallbackAnalysis(emailContent)
  }
}

/**
 * Generate basic fallback analysis if Gemini API fails
 */
function generateFallbackAnalysis(emailContent: string): EmailAnalysisResult {
  const lowerContent = emailContent.toLowerCase()
  const indicators: EmailAnalysisIndicator[] = []
  let score = 0

  // Check for suspicious keywords
  const suspiciousKeywords = [
    'urgent', 'verify', 'suspended', 'confirm', 'click here',
    'act now', 'limited time', 'winner', 'prize', 'free money',
    'password', 'social security', 'bank account', 'credit card'
  ]

  const foundKeywords = suspiciousKeywords.filter(keyword => lowerContent.includes(keyword))
  if (foundKeywords.length > 0) {
    score += foundKeywords.length * 15
    indicators.push({
      name: 'Suspicious Keywords Detected',
      severity: foundKeywords.length > 3 ? 'high' : 'medium',
      description: `Found suspicious keywords: ${foundKeywords.slice(0, 5).join(', ')}`
    })
  }

  // Check for generic greetings
  if (lowerContent.includes('dear customer') || lowerContent.includes('dear user')) {
    score += 20
    indicators.push({
      name: 'Generic Greeting',
      severity: 'medium',
      description: 'Email uses generic greeting instead of your name'
    })
  }

  // Check for urgency
  if (lowerContent.includes('immediately') || lowerContent.includes('within 24 hours')) {
    score += 25
    indicators.push({
      name: 'Urgency Tactics',
      severity: 'high',
      description: 'Email creates false sense of urgency'
    })
  }

  // Determine risk level
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  if (score < 20) {
    riskLevel = 'safe'
    indicators.push({
      name: 'No Major Red Flags',
      severity: 'safe',
      description: 'Email appears to be legitimate'
    })
  } else if (score < 40) {
    riskLevel = 'low'
  } else if (score < 60) {
    riskLevel = 'medium'
  } else if (score < 80) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  const probability = Math.min(100, score)
  const isScam = probability > 50

  let verdict = ''
  if (riskLevel === 'safe' || riskLevel === 'low') {
    verdict = 'This email appears to be safe with minimal suspicious indicators. However, always verify sender identity before taking any action.'
  } else if (riskLevel === 'medium') {
    verdict = 'This email shows some suspicious characteristics. Exercise caution and verify the sender through official channels before responding or clicking links.'
  } else {
    verdict = 'This email exhibits multiple red flags consistent with phishing or scam attempts. Do not click links, download attachments, or provide any information. Delete this email immediately.'
  }

  return {
    isScam,
    probability,
    riskLevel,
    indicators,
    verdict,
    timestamp: new Date().toISOString()
  }
}
