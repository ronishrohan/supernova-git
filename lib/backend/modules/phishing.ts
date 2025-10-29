export interface PhishingResult {
  label: 'safe' | 'suspicious' | 'malicious'
  score: number
  probabilities: Record<string, number>
  explanation: string
  features: string[]
}

// Phishing indicators and their weights
const PHISHING_INDICATORS = {
  // High-risk indicators
  'verify account': 0.8,
  'urgent action': 0.75,
  'suspend': 0.85,
  'confirm identity': 0.8,
  'unusual activity': 0.7,
  'click here immediately': 0.9,
  'verify password': 0.85,
  'update payment': 0.8,
  'confirm payment': 0.8,
  'account locked': 0.85,

  // Medium-risk indicators
  'dear customer': 0.5,
  'dear user': 0.5,
  'click here': 0.6,
  'act now': 0.65,
  'limited time': 0.55,
  'expire': 0.6,
  'refund': 0.5,

  // Banking/financial terms
  'bank account': 0.65,
  'credit card': 0.7,
  'payment method': 0.6,
  'billing information': 0.7,
  'social security': 0.9,
  'ssn': 0.9,
  'wire transfer': 0.75,

  // Prize/reward scams
  'congratulations': 0.6,
  'winner': 0.7,
  'prize': 0.65,
  'lottery': 0.8,
  'free gift': 0.6,
  'claim now': 0.7,

  // Authority impersonation
  'irs': 0.85,
  'government': 0.7,
  'legal action': 0.8,
  'lawsuit': 0.75,
  'warrant': 0.85
}

const SAFE_INDICATORS = {
  'unsubscribe': -0.3,
  'privacy policy': -0.2,
  'terms of service': -0.2,
  'newsletter': -0.1
}

/**
 * Extract features from email text for analysis
 */
function extractFeatures(text: string): string[] {
  const features: string[] = []
  const lowerText = text.toLowerCase()

  // Check for URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length
  if (urlCount > 3) features.push('multiple_urls')
  if (urlCount > 10) features.push('excessive_urls')

  // Check for IP addresses in URLs
  if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(text)) {
    features.push('ip_address_url')
  }

  // Check for URL shorteners
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly']
  if (shorteners.some((s) => lowerText.includes(s))) {
    features.push('url_shortener')
  }

  // Check for excessive punctuation/capitalization
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.3) features.push('excessive_caps')

  const exclamationCount = (text.match(/!/g) || []).length
  if (exclamationCount > 5) features.push('excessive_exclamation')

  // Check for urgency keywords
  const urgencyWords = [
    'urgent',
    'immediate',
    'now',
    'today',
    'asap',
    'quickly',
    'hurry',
    'fast'
  ]
  const urgencyCount = urgencyWords.filter((word) => lowerText.includes(word)).length
  if (urgencyCount > 2) features.push('high_urgency')

  // Check for credential requests
  const credentialWords = [
    'password',
    'username',
    'pin',
    'cvv',
    'credit card',
    'ssn',
    'social security'
  ]
  const credentialCount = credentialWords.filter((word) => lowerText.includes(word)).length
  if (credentialCount > 0) features.push('credential_request')

  // Check for generic greetings
  if (lowerText.includes('dear customer') || lowerText.includes('dear user')) {
    features.push('generic_greeting')
  }

  // Check for threats/pressure tactics
  const threatWords = [
    'suspend',
    'locked',
    'disabled',
    'expire',
    'legal action',
    'lawsuit',
    'penalty'
  ]
  if (threatWords.some((word) => lowerText.includes(word))) {
    features.push('threat_language')
  }

  // Check for misspellings (common phishing tactic)
  const misspellings = [
    'acount',
    'recieve',
    'verfiy',
    'confirme',
    'securtiy',
    'atach',
    'seperate'
  ]
  if (misspellings.some((word) => lowerText.includes(word))) {
    features.push('spelling_errors')
  }

  // Check for HTML/links mismatch
  if (/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi.test(text)) {
    const matches = text.matchAll(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi)
    for (const match of matches) {
      const href = match[1]
      const displayText = match[2]
      if (!href.includes(displayText) && !displayText.includes('click here')) {
        features.push('link_text_mismatch')
        break
      }
    }
  }

  // Check for attachments (in email context)
  if (lowerText.includes('attachment') || lowerText.includes('attached file')) {
    features.push('has_attachment')
  }

  return features
}

/**
 * Calculate phishing score using rule-based analysis
 */
function calculateRuleBasedScore(text: string, features: string[]): {
  score: number
  probabilities: Record<string, number>
  explanation: string
} {
  const lowerText = text.toLowerCase()
  let phishingScore = 0
  let safeScore = 0

  const foundIndicators: string[] = []

  // Check phishing indicators
  for (const [indicator, weight] of Object.entries(PHISHING_INDICATORS)) {
    if (lowerText.includes(indicator)) {
      phishingScore += weight
      foundIndicators.push(indicator)
    }
  }

  // Check safe indicators
  for (const [indicator, weight] of Object.entries(SAFE_INDICATORS)) {
    if (lowerText.includes(indicator)) {
      safeScore += Math.abs(weight)
    }
  }

  // Feature-based scoring
  const featureWeights: Record<string, number> = {
    multiple_urls: 0.3,
    excessive_urls: 0.6,
    ip_address_url: 0.7,
    url_shortener: 0.6,
    excessive_caps: 0.4,
    excessive_exclamation: 0.3,
    high_urgency: 0.5,
    credential_request: 0.8,
    generic_greeting: 0.4,
    threat_language: 0.7,
    spelling_errors: 0.6,
    link_text_mismatch: 0.8,
    has_attachment: 0.2
  }

  for (const feature of features) {
    if (featureWeights[feature]) {
      phishingScore += featureWeights[feature]
    }
  }

  // Normalize scores
  const totalScore = phishingScore + safeScore
  const normalizedPhishing = totalScore > 0 ? phishingScore / (phishingScore + safeScore) : 0
  const normalizedSafe = totalScore > 0 ? safeScore / (phishingScore + safeScore) : 1

  // Calculate final score (0-100, higher = more likely phishing)
  const finalScore = Math.min(100, normalizedPhishing * 100)

  // Generate explanation
  let explanation = ''
  if (finalScore >= 70) {
    explanation = `HIGH RISK: This message exhibits multiple phishing characteristics. `
  } else if (finalScore >= 40) {
    explanation = `MODERATE RISK: This message shows some suspicious patterns. `
  } else {
    explanation = `LOW RISK: This message appears relatively safe. `
  }

  if (foundIndicators.length > 0) {
    explanation += `Found phishing keywords: ${foundIndicators.slice(0, 3).join(', ')}. `
  }

  if (features.length > 0) {
    explanation += `Detected features: ${features.slice(0, 3).join(', ')}.`
  }

  return {
    score: finalScore,
    probabilities: {
      safe: Math.round(normalizedSafe * 100) / 100,
      suspicious: Math.round((1 - Math.abs(normalizedPhishing - 0.5) * 2) * 100) / 100,
      malicious: Math.round(normalizedPhishing * 100) / 100
    },
    explanation
  }
}

/**
 * ⚠️ ML MODEL PLACEHOLDER ⚠️
 *
 * This is where you'll integrate your trained phishing detection ML model.
 *
 * Expected input: Email text as string
 * Expected output: {
 *   predictions: { safe: number, suspicious: number, malicious: number },
 *   confidence: number,
 *   features: string[]
 * }
 *
 * Example integration:
 * ```typescript
 * import * as tf from '@tensorflow/tfjs-node'
 * import { loadModel } from './your-model-loader'
 *
 * async function predictPhishingModel(text: string) {
 *   const model = await loadModel()
 *   const tokenized = tokenizeText(text)
 *   const tensor = tf.tensor2d([tokenized])
 *   const prediction = await model.predict(tensor)
 *   const probabilities = await prediction.data()
 *
 *   return {
 *     predictions: {
 *       safe: probabilities[0],
 *       suspicious: probabilities[1],
 *       malicious: probabilities[2]
 *     },
 *     confidence: Math.max(...probabilities),
 *     features: extractFeatures(text)
 *   }
 * }
 * ```
 */
async function predictPhishingModel(
  text: string
): Promise<{
  predictions: { safe: number; suspicious: number; malicious: number }
  confidence: number
  features: string[]
} | null> {
  // TODO: Replace this with your actual ML model
  // Uncomment and implement when you have your model ready:
  //
  // try {
  //   const model = await loadYourModel()
  //   const prediction = await model.predict(text)
  //   return prediction
  // } catch (error) {
  //   console.error('ML model prediction failed:', error)
  //   return null
  // }

  return null // Returns null to use rule-based fallback
}

/**
 * Analyze email text for phishing indicators
 *
 * This function will use your ML model if available, otherwise falls back to
 * rule-based analysis.
 */
export async function analyzeEmail(text: string): Promise<PhishingResult> {
  // Extract features from text
  const features = extractFeatures(text)

  // Try ML model first
  const mlResult = await predictPhishingModel(text)

  if (mlResult) {
    // ML model is available - use its predictions
    const { predictions, confidence } = mlResult

    let label: 'safe' | 'suspicious' | 'malicious'
    const maxProb = Math.max(predictions.safe, predictions.suspicious, predictions.malicious)

    if (maxProb === predictions.malicious) {
      label = 'malicious'
    } else if (maxProb === predictions.suspicious) {
      label = 'suspicious'
    } else {
      label = 'safe'
    }

    const score = Math.round(
      predictions.safe * 0 + predictions.suspicious * 50 + predictions.malicious * 100
    )

    return {
      label,
      score,
      probabilities: {
        safe: predictions.safe,
        suspicious: predictions.suspicious,
        malicious: predictions.malicious
      },
      explanation: `ML Model (${Math.round(confidence * 100)}% confidence): ${label.toUpperCase()} - ${features.length} suspicious features detected.`,
      features
    }
  } else {
    // Fallback to rule-based analysis
    const ruleResult = calculateRuleBasedScore(text, features)

    let label: 'safe' | 'suspicious' | 'malicious'
    if (ruleResult.score >= 70) {
      label = 'malicious'
    } else if (ruleResult.score >= 40) {
      label = 'suspicious'
    } else {
      label = 'safe'
    }

    return {
      label,
      score: ruleResult.score,
      probabilities: ruleResult.probabilities,
      explanation: ruleResult.explanation,
      features
    }
  }
}

/**
 * Batch analyze multiple emails
 */
export async function analyzeEmailBatch(emails: string[]): Promise<PhishingResult[]> {
  const results = await Promise.all(emails.map((email) => analyzeEmail(email)))
  return results
}

/**
 * Get phishing statistics from analysis history
 */
export function getPhishingStats(results: PhishingResult[]): {
  totalAnalyzed: number
  safeCount: number
  suspiciousCount: number
  maliciousCount: number
  avgScore: number
} {
  return {
    totalAnalyzed: results.length,
    safeCount: results.filter((r) => r.label === 'safe').length,
    suspiciousCount: results.filter((r) => r.label === 'suspicious').length,
    maliciousCount: results.filter((r) => r.label === 'malicious').length,
    avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length || 0
  }
}
