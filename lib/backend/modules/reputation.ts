/**
 * Web Reputation Checker Module
 *
 * Analyzes URLs for safety and reputation using various heuristics.
 */

import { URL } from 'url'
import dns from 'dns/promises'

export interface ReputationResult {
  url: string
  score: number // 0-100 (higher = safer)
  risk: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  checks: ReputationCheck[]
  recommendation: string
  timestamp: string
}

export interface ReputationCheck {
  name: string
  passed: boolean
  weight: number
  details: string
}

// Known malicious TLDs
const SUSPICIOUS_TLDS = [
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.xyz',
  '.top',
  '.work',
  '.click',
  '.link',
  '.download',
  '.stream'
]

// Known safe/trusted domains
const TRUSTED_DOMAINS = [
  'google.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'facebook.com',
  'twitter.com',
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
  'youtube.com',
  'reddit.com'
]

// Blacklist keywords
const BLACKLIST_KEYWORDS = [
  'casino',
  'poker',
  'viagra',
  'cialis',
  'pharmacy',
  'lottery',
  'prize',
  'winner',
  'claim-now',
  'free-money',
  'bitcoin-generator',
  'hack',
  'crack',
  'keygen',
  'torrent',
  'pirate',
  'adult',
  'xxx',
  'porn'
]

/**
 * Check if domain uses HTTPS
 */
function checkHTTPS(url: URL): ReputationCheck {
  const passed = url.protocol === 'https:'

  return {
    name: 'HTTPS Encryption',
    passed,
    weight: 20,
    details: passed
      ? 'Site uses HTTPS encryption'
      : 'Site does not use HTTPS (insecure)'
  }
}

/**
 * Check for suspicious TLD
 */
function checkTLD(url: URL): ReputationCheck {
  const hostname = url.hostname.toLowerCase()
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld))

  return {
    name: 'Domain TLD',
    passed: !hasSuspiciousTLD,
    weight: 25,
    details: hasSuspiciousTLD
      ? 'Suspicious top-level domain (commonly used for spam/scams)'
      : 'Legitimate top-level domain'
  }
}

/**
 * Check if domain is trusted
 */
function checkTrustedDomain(url: URL): ReputationCheck {
  const hostname = url.hostname.toLowerCase()
  const isTrusted = TRUSTED_DOMAINS.some((domain) => hostname.includes(domain))

  return {
    name: 'Trusted Domain',
    passed: isTrusted,
    weight: 30,
    details: isTrusted
      ? 'Domain is in trusted whitelist'
      : 'Domain not in trusted whitelist'
  }
}

/**
 * Check for IP address instead of domain
 */
function checkIPAddress(url: URL): ReputationCheck {
  const hostname = url.hostname
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(hostname)

  return {
    name: 'Domain vs IP',
    passed: !isIP,
    weight: 30,
    details: isIP
      ? 'Uses IP address instead of domain name (suspicious)'
      : 'Uses proper domain name'
  }
}

/**
 * Check for blacklisted keywords
 */
function checkBlacklistKeywords(url: URL): ReputationCheck {
  const fullUrl = url.href.toLowerCase()
  const foundKeywords = BLACKLIST_KEYWORDS.filter((keyword) =>
    fullUrl.includes(keyword)
  )

  return {
    name: 'Content Keywords',
    passed: foundKeywords.length === 0,
    weight: 25,
    details:
      foundKeywords.length > 0
        ? `Blacklisted keywords found: ${foundKeywords.join(', ')}`
        : 'No suspicious keywords detected'
  }
}

/**
 * Check for excessive subdomains
 */
function checkSubdomains(url: URL): ReputationCheck {
  const hostname = url.hostname
  const parts = hostname.split('.')
  const subdomainCount = parts.length - 2 // Minus domain and TLD

  const passed = subdomainCount <= 2

  return {
    name: 'Subdomain Structure',
    passed,
    weight: 15,
    details: passed
      ? 'Normal subdomain structure'
      : `Excessive subdomains (${subdomainCount}) - often used in phishing`
  }
}

/**
 * Check URL length
 */
function checkURLLength(url: URL): ReputationCheck {
  const length = url.href.length
  const passed = length <= 100

  return {
    name: 'URL Length',
    passed,
    weight: 10,
    details: passed
      ? 'Normal URL length'
      : `Excessively long URL (${length} chars) - potential obfuscation`
  }
}

/**
 * Check for URL obfuscation techniques
 */
function checkObfuscation(url: URL): ReputationCheck {
  const href = url.href

  // Check for @ symbol (hides actual destination)
  const hasAt = href.includes('@')

  // Check for excessive percent encoding
  const percentCount = (href.match(/%/g) || []).length
  const hasExcessiveEncoding = percentCount > 5

  // Check for hex encoding in hostname
  const hasHexInHostname = /[0-9a-f]{8,}/i.test(url.hostname)

  const issues = []
  if (hasAt) issues.push('@ symbol detected')
  if (hasExcessiveEncoding) issues.push('excessive URL encoding')
  if (hasHexInHostname) issues.push('hex patterns in hostname')

  const passed = issues.length === 0

  return {
    name: 'URL Obfuscation',
    passed,
    weight: 30,
    details: passed
      ? 'No obfuscation detected'
      : `Obfuscation techniques: ${issues.join(', ')}`
  }
}

/**
 * Check for homograph attack (lookalike characters)
 */
function checkHomograph(url: URL): ReputationCheck {
  const hostname = url.hostname

  // Check for non-ASCII characters
  const hasNonASCII = /[^\x00-\x7F]/.test(hostname)

  // Check for mixed scripts (e.g., Latin + Cyrillic)
  const hasCyrillic = /[а-яА-Я]/.test(hostname)
  const hasGreek = /[α-ωΑ-Ω]/.test(hostname)

  const passed = !hasNonASCII && !hasCyrillic && !hasGreek

  return {
    name: 'Homograph Attack',
    passed,
    weight: 35,
    details: passed
      ? 'No lookalike characters detected'
      : 'Non-ASCII or lookalike characters detected (possible homograph attack)'
  }
}

/**
 * Check domain age (via DNS)
 * Note: This is a simplified check - full domain age would require WHOIS
 */
async function checkDomainResolution(url: URL): Promise<ReputationCheck> {
  try {
    await dns.resolve4(url.hostname)

    return {
      name: 'Domain Resolution',
      passed: true,
      weight: 15,
      details: 'Domain resolves successfully'
    }
  } catch {
    return {
      name: 'Domain Resolution',
      passed: false,
      weight: 15,
      details: 'Domain does not resolve (may be fake or offline)'
    }
  }
}

/**
 * Check for URL shorteners
 */
function checkURLShortener(url: URL): ReputationCheck {
  const shorteners = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'bl.ink',
    'lnkd.in'
  ]

  const hostname = url.hostname.toLowerCase()
  const isShortener = shorteners.some((s) => hostname.includes(s))

  return {
    name: 'URL Shortener',
    passed: !isShortener,
    weight: 20,
    details: isShortener
      ? 'URL shortener detected (can hide malicious destination)'
      : 'Direct URL (not shortened)'
  }
}

/**
 * Calculate reputation score
 */
function calculateScore(checks: ReputationCheck[]): number {
  let totalWeight = 0
  let earnedWeight = 0

  for (const check of checks) {
    totalWeight += check.weight
    if (check.passed) {
      earnedWeight += check.weight
    }
  }

  return Math.round((earnedWeight / totalWeight) * 100)
}

/**
 * Determine risk level from score
 */
function determineRisk(score: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 85) return 'safe'
  if (score >= 70) return 'low'
  if (score >= 50) return 'medium'
  if (score >= 30) return 'high'
  return 'critical'
}

/**
 * Generate recommendation
 */
function generateRecommendation(score: number, risk: string, checks: ReputationCheck[]): string {
  const failedChecks = checks.filter((c) => !c.passed)

  if (risk === 'safe') {
    return '✅ This website appears safe to visit. All security checks passed.'
  }

  if (risk === 'low') {
    return '⚠️ This website is likely safe, but exercise normal caution.'
  }

  if (risk === 'medium') {
    return `⚠️ This website shows some concerning signs. Issues: ${failedChecks.map((c) => c.name).join(', ')}. Proceed with caution.`
  }

  if (risk === 'high') {
    return `🚨 This website is potentially dangerous. Multiple red flags detected. Avoid entering sensitive information.`
  }

  return `🛑 DANGER: This website is very likely malicious. Do not visit or enter any information. Failed checks: ${failedChecks.map((c) => c.name).join(', ')}.`
}

/**
 * Check URL reputation
 */
export async function checkUrlReputation(urlString: string): Promise<ReputationResult> {
  try {
    // Parse URL
    const url = new URL(urlString)

    // Run all checks
    const checks: ReputationCheck[] = [
      checkHTTPS(url),
      checkTLD(url),
      checkTrustedDomain(url),
      checkIPAddress(url),
      checkBlacklistKeywords(url),
      checkSubdomains(url),
      checkURLLength(url),
      checkObfuscation(url),
      checkHomograph(url),
      checkURLShortener(url)
    ]

    // Add async DNS check
    const dnsCheck = await checkDomainResolution(url)
    checks.push(dnsCheck)

    // Calculate score
    const score = calculateScore(checks)
    const risk = determineRisk(score)
    const recommendation = generateRecommendation(score, risk, checks)

    return {
      url: urlString,
      score,
      risk,
      checks,
      recommendation,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    // Invalid URL
    return {
      url: urlString,
      score: 0,
      risk: 'critical',
      checks: [
        {
          name: 'URL Validation',
          passed: false,
          weight: 100,
          details: 'Invalid URL format'
        }
      ],
      recommendation: '🛑 INVALID URL: This is not a valid URL format.',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Batch check multiple URLs
 */
export async function checkUrlReputationBatch(
  urls: string[]
): Promise<ReputationResult[]> {
  const results = await Promise.all(urls.map((url) => checkUrlReputation(url)))
  return results
}

/**
 * Get quick verdict for URL (simplified)
 */
export async function getQuickVerdict(urlString: string): Promise<{
  safe: boolean
  score: number
  reason: string
}> {
  const result = await checkUrlReputation(urlString)

  return {
    safe: result.risk === 'safe' || result.risk === 'low',
    score: result.score,
    reason: result.recommendation
  }
}
