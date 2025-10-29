import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { URL } from 'url'

export interface ScanResult {
  score: number
  verdict: 'clean' | 'suspicious' | 'malicious'
  reasons: string[]
  id: string
  timestamp: string
  scanType: 'file' | 'text' | 'url'
  target: string
}

// Suspicious patterns for text/URL analysis
const PHISHING_KEYWORDS = [
  'verify account',
  'urgent action',
  'confirm identity',
  'suspended account',
  'click here immediately',
  'prize winner',
  'account locked',
  'unusual activity',
  'verify password',
  'confirm payment',
  'update billing'
]

const SUSPICIOUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.ps1'
]

const MALICIOUS_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  't.co'
]

/**
 * Calculate Shannon entropy to detect random-looking strings (common in malware)
 */
function calculateEntropy(str: string): number {
  const len = str.length
  const frequencies = new Map<string, number>()

  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1)
  }

  let entropy = 0
  for (const count of frequencies.values()) {
    const p = count / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}

/**
 * Check if URL is suspicious based on structure and patterns
 */
function analyzeUrl(urlString: string): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 100

  try {
    const url = new URL(urlString)

    // Check protocol
    if (url.protocol !== 'https:') {
      reasons.push('Non-HTTPS protocol detected')
      score -= 20
    }

    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top']
    if (suspiciousTlds.some((tld) => url.hostname.endsWith(tld))) {
      reasons.push('Suspicious top-level domain')
      score -= 25
    }

    // Check for IP address in hostname
    if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
      reasons.push('IP address used instead of domain name')
      score -= 30
    }

    // Check for URL shorteners
    if (MALICIOUS_DOMAINS.some((domain) => url.hostname.includes(domain))) {
      reasons.push('URL shortener detected (potential phishing)')
      score -= 35
    }

    // Check entropy of path (randomness)
    if (url.pathname.length > 10) {
      const pathEntropy = calculateEntropy(url.pathname)
      if (pathEntropy > 4) {
        reasons.push('High entropy in URL path (randomly generated)')
        score -= 20
      }
    }

    // Check for excessive subdomains
    const subdomainCount = url.hostname.split('.').length - 2
    if (subdomainCount > 3) {
      reasons.push('Excessive subdomains detected')
      score -= 15
    }

    // Check for @ symbol (username in URL - phishing technique)
    if (urlString.includes('@')) {
      reasons.push('Username in URL (common phishing technique)')
      score -= 40
    }

    // Check for homograph attacks (lookalike domains)
    if (/[а-яА-Я]/.test(url.hostname)) {
      reasons.push('Cyrillic characters in domain (possible homograph attack)')
      score -= 45
    }

    // Check URL length
    if (urlString.length > 200) {
      reasons.push('Excessively long URL')
      score -= 10
    }

    if (reasons.length === 0) {
      reasons.push('URL appears legitimate')
    }
  } catch (error) {
    reasons.push('Invalid URL format')
    score = 0
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

/**
 * Analyze text content for phishing indicators
 */
function analyzeText(text: string): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 100

  const lowerText = text.toLowerCase()

  // Check for phishing keywords
  const foundKeywords = PHISHING_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword)
  )
  if (foundKeywords.length > 0) {
    reasons.push(`Phishing keywords detected: ${foundKeywords.join(', ')}`)
    score -= foundKeywords.length * 15
  }

  // Check for suspicious links in text
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex)
  if (urls && urls.length > 5) {
    reasons.push('Excessive number of URLs detected')
    score -= 20
  }

  // Check for urgency language
  const urgencyWords = ['urgent', 'immediate', 'now', 'quickly', 'today']
  const urgencyCount = urgencyWords.filter((word) => lowerText.includes(word)).length
  if (urgencyCount > 2) {
    reasons.push('High-pressure/urgency language detected')
    score -= 15
  }

  // Check for credential requests
  const credentialWords = ['password', 'username', 'credit card', 'ssn', 'social security']
  const credentialCount = credentialWords.filter((word) => lowerText.includes(word)).length
  if (credentialCount > 0) {
    reasons.push('Requests for sensitive credentials detected')
    score -= 25
  }

  // Check for suspicious sender patterns
  if (lowerText.includes('dear customer') || lowerText.includes('dear user')) {
    reasons.push('Generic greeting (not personalized)')
    score -= 10
  }

  // Check for spelling errors (simple heuristic)
  const commonMisspellings = ['acount', 'confirme', 'securtiy', 'verfiy', 'recieve']
  const misspellingCount = commonMisspellings.filter((word) =>
    lowerText.includes(word)
  ).length
  if (misspellingCount > 0) {
    reasons.push('Spelling errors detected (sign of phishing)')
    score -= 20
  }

  if (reasons.length === 0) {
    reasons.push('Text appears legitimate')
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

/**
 * Analyze file for potential threats
 */
async function analyzeFile(filePath: string): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = []
  let score = 100

  try {
    const stats = await fs.stat(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath)

    // Check file extension
    if (SUSPICIOUS_EXTENSIONS.includes(ext)) {
      reasons.push(`Potentially dangerous file extension: ${ext}`)
      score -= 40
    }

    // Check for double extensions
    const parts = fileName.split('.')
    if (parts.length > 2) {
      reasons.push('Double extension detected (common malware technique)')
      score -= 30
    }

    // Check file size
    if (stats.size === 0) {
      reasons.push('Empty file detected')
      score -= 20
    } else if (stats.size < 100) {
      reasons.push('Suspiciously small file')
      score -= 15
    }

    // Check for hidden file
    if (fileName.startsWith('.')) {
      reasons.push('Hidden file detected')
      score -= 10
    }

    // Read file content for basic analysis (first 1KB)
    const buffer = Buffer.alloc(Math.min(1024, stats.size))
    const fileHandle = await fs.open(filePath, 'r')
    await fileHandle.read(buffer, 0, buffer.length, 0)
    await fileHandle.close()

    const content = buffer.toString('utf-8', 0, buffer.length)

    // Check for executable signatures
    if (content.startsWith('MZ')) {
      reasons.push('Windows executable detected')
      score -= 25
    }

    // Check entropy of file content
    const entropy = calculateEntropy(content)
    if (entropy > 7.5) {
      reasons.push('High entropy detected (possible encrypted/packed malware)')
      score -= 35
    }

    // Check for suspicious strings in content
    const suspiciousStrings = ['eval(', 'exec(', 'system(', 'shell_exec', 'powershell']
    const foundStrings = suspiciousStrings.filter((str) => content.includes(str))
    if (foundStrings.length > 0) {
      reasons.push(`Suspicious code patterns detected: ${foundStrings.join(', ')}`)
      score -= 30
    }

    if (reasons.length === 0) {
      reasons.push('File appears safe')
    }
  } catch (error) {
    reasons.push(`Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    score = 50
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

/**
 * Placeholder for ML model integration
 * Replace this with your trained ML model for advanced scanning
 */
async function callModelForScan(
  scanType: 'file' | 'text' | 'url',
  data: string
): Promise<{ score: number; reasons: string[] } | null> {
  // TODO: Integrate your ML model here
  // Example:
  // const model = await loadModel()
  // const prediction = await model.predict(data)
  // return { score: prediction.confidence * 100, reasons: prediction.features }

  return null // Return null to use rule-based fallback
}

/**
 * Scan a file for threats
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
  let score = 100
  let reasons: string[] = []

  // Try ML model first
  const mlResult = await callModelForScan('file', filePath)
  if (mlResult) {
    score = mlResult.score
    reasons = mlResult.reasons
  } else {
    // Fallback to rule-based analysis
    const result = await analyzeFile(filePath)
    score = result.score
    reasons = result.reasons
  }

  // Determine verdict based on score
  let verdict: 'clean' | 'suspicious' | 'malicious'
  if (score >= 70) {
    verdict = 'clean'
  } else if (score >= 40) {
    verdict = 'suspicious'
  } else {
    verdict = 'malicious'
  }

  const scanResult: ScanResult = {
    score,
    verdict,
    reasons,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    scanType: 'file',
    target: filePath
  }

  // Save scan result to history
  await saveScanResult(scanResult)

  return scanResult
}

/**
 * Scan text content for threats
 */
export async function scanText(text: string): Promise<ScanResult> {
  let score = 100
  let reasons: string[] = []

  // Try ML model first
  const mlResult = await callModelForScan('text', text)
  if (mlResult) {
    score = mlResult.score
    reasons = mlResult.reasons
  } else {
    // Fallback to rule-based analysis
    const result = analyzeText(text)
    score = result.score
    reasons = result.reasons
  }

  // Determine verdict
  let verdict: 'clean' | 'suspicious' | 'malicious'
  if (score >= 70) {
    verdict = 'clean'
  } else if (score >= 40) {
    verdict = 'suspicious'
  } else {
    verdict = 'malicious'
  }

  const scanResult: ScanResult = {
    score,
    verdict,
    reasons,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    scanType: 'text',
    target: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  }

  await saveScanResult(scanResult)

  return scanResult
}

/**
 * Scan a URL for threats
 */
export async function scanUrl(url: string): Promise<ScanResult> {
  let score = 100
  let reasons: string[] = []

  // Try ML model first
  const mlResult = await callModelForScan('url', url)
  if (mlResult) {
    score = mlResult.score
    reasons = mlResult.reasons
  } else {
    // Fallback to rule-based analysis
    const result = analyzeUrl(url)
    score = result.score
    reasons = result.reasons
  }

  // Determine verdict
  let verdict: 'clean' | 'suspicious' | 'malicious'
  if (score >= 70) {
    verdict = 'clean'
  } else if (score >= 40) {
    verdict = 'suspicious'
  } else {
    verdict = 'malicious'
  }

  const scanResult: ScanResult = {
    score,
    verdict,
    reasons,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    scanType: 'url',
    target: url
  }

  await saveScanResult(scanResult)

  return scanResult
}

/**
 * Save scan result to history
 */
async function saveScanResult(result: ScanResult): Promise<void> {
  try {
    const dataDir = path.join(__dirname, '..', 'data')
    await fs.mkdir(dataDir, { recursive: true })

    const historyFile = path.join(dataDir, 'scan-history.json')

    let history: ScanResult[] = []
    try {
      const data = await fs.readFile(historyFile, 'utf-8')
      history = JSON.parse(data)
    } catch {
      // File doesn't exist yet
    }

    history.unshift(result) // Add to beginning

    // Keep only last 100 scans
    if (history.length > 100) {
      history = history.slice(0, 100)
    }

    await fs.writeFile(historyFile, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('Error saving scan result:', error)
  }
}

/**
 * Get scan history
 */
export async function getScanHistory(limit = 50): Promise<ScanResult[]> {
  try {
    const dataDir = path.join(__dirname, '..', 'data')
    const historyFile = path.join(dataDir, 'scan-history.json')

    const data = await fs.readFile(historyFile, 'utf-8')
    const history: ScanResult[] = JSON.parse(data)

    return history.slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Get scan statistics
 */
export async function getScanStats(): Promise<{
  totalScans: number
  cleanCount: number
  suspiciousCount: number
  maliciousCount: number
  lastScanTime: string | null
}> {
  const history = await getScanHistory(100)

  return {
    totalScans: history.length,
    cleanCount: history.filter((s) => s.verdict === 'clean').length,
    suspiciousCount: history.filter((s) => s.verdict === 'suspicious').length,
    maliciousCount: history.filter((s) => s.verdict === 'malicious').length,
    lastScanTime: history[0]?.timestamp || null
  }
}
