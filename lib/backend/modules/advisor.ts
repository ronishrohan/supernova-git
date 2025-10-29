

export interface SecurityResponse {
  query: string
  answer: string
  category: string
  confidence: number
  relatedTopics: string[]
  sources?: string[]
}

// Knowledge base of security topics and responses
const SECURITY_KNOWLEDGE: Record<
  string,
  {
    keywords: string[]
    response: string
    category: string
    relatedTopics: string[]
  }
> = {
  wifi_security: {
    keywords: ['wifi', 'wi-fi', 'wireless', 'router', 'network security'],
    response: `To secure your Wi-Fi network:

1. **Use WPA3 encryption** (or WPA2 if WPA3 isn't available)
2. **Change default credentials** - Never use the default admin username/password
3. **Use a strong password** - At least 16 characters with mixed case, numbers, and symbols
4. **Disable WPS** (Wi-Fi Protected Setup) - It's vulnerable to brute-force attacks
5. **Hide SSID** (optional) - Makes your network less visible
6. **Enable MAC filtering** - Only allow known devices
7. **Update router firmware** regularly
8. **Use a guest network** for visitors
9. **Disable remote management** unless needed
10. **Position router centrally** to minimize signal leakage outside`,
    category: 'Network Security',
    relatedTopics: ['password strength', 'network monitoring', 'vpn']
  },

  password_strength: {
    keywords: ['password', 'passphrase', 'credentials', 'strong password'],
    response: `Creating strong passwords:

**Best Practices:**
- **Length:** Minimum 12 characters (16+ recommended)
- **Complexity:** Mix uppercase, lowercase, numbers, and symbols
- **Uniqueness:** Different password for every account
- **Use a password manager** to generate and store passwords
- **Enable 2FA/MFA** wherever possible
- **Avoid:** Dictionary words, personal info, patterns, reuse

**Good Examples:**
- Passphrase: "Purple-Elephant-Dancing-42!"
- Random: "xK9#mP2$vL6@nQ8"

**Password Manager Recommendations:**
- Bitwarden (open-source)
- 1Password
- LastPass
- KeePassXC (offline)`,
    category: 'Authentication',
    relatedTopics: ['2fa', 'password manager', 'account security']
  },

  phishing: {
    keywords: ['phishing', 'email scam', 'suspicious email', 'fake email'],
    response: `Identifying and avoiding phishing attacks:

**Red Flags:**
🚩 Urgent/threatening language
🚩 Generic greetings ("Dear Customer")
🚩 Requests for sensitive info
🚩 Suspicious sender address
🚩 Misspellings/grammar errors
🚩 Unexpected attachments
🚩 Links don't match displayed text
🚩 Too good to be true offers

**Protection Steps:**
1. **Verify sender** - Check email address carefully
2. **Don't click links** - Type URLs manually
3. **Hover over links** - Check actual destination
4. **Check for HTTPS** - Secure sites use encryption
5. **Enable spam filters**
6. **Report phishing** - Forward to security team
7. **Use email authentication** (SPF, DKIM, DMARC)
8. **Be skeptical** - When in doubt, verify directly`,
    category: 'Email Security',
    relatedTopics: ['email security', 'social engineering', 'malware']
  },

  two_factor: {
    keywords: ['2fa', 'mfa', 'two factor', 'multi factor', 'authentication'],
    response: `Two-Factor Authentication (2FA/MFA) guide:

**What is 2FA?**
Additional security layer requiring two forms of verification:
1. Something you know (password)
2. Something you have (phone, token, key)
3. Something you are (biometric)

**Best Methods (most to least secure):**
1. **Hardware keys** (YubiKey, Titan) - Most secure
2. **Authenticator apps** (Authy, Google Authenticator, Microsoft Authenticator)
3. **Push notifications** (device approval)
4. **SMS codes** (least secure, but better than nothing)

**Setup Guide:**
- Enable on email, banking, social media first
- Save backup codes in secure location
- Use multiple devices for redundancy
- Consider hardware keys for critical accounts

**Never:**
- Share 2FA codes with anyone
- Store codes in plain text
- Use same 2FA method everywhere`,
    category: 'Authentication',
    relatedTopics: ['password strength', 'account security', 'biometric']
  },

  vpn: {
    keywords: ['vpn', 'virtual private network', 'privacy', 'anonymous'],
    response: `VPN (Virtual Private Network) guide:

**What VPNs Do:**
✓ Encrypt your internet traffic
✓ Hide your IP address
✓ Bypass geo-restrictions
✓ Protect on public Wi-Fi
✓ Prevent ISP tracking

**When to Use:**
- Public Wi-Fi (coffee shops, airports)
- Remote work
- Accessing sensitive data
- Traveling abroad
- Privacy-focused browsing

**Choosing a VPN:**
- **No-logs policy** - Doesn't track activity
- **Strong encryption** (AES-256)
- **Kill switch** - Blocks traffic if VPN drops
- **Fast servers** in multiple locations
- **Trusted provider** with good reputation

**Recommended VPNs:**
- ProtonVPN (privacy-focused)
- Mullvad (anonymous)
- IVPN (secure)
- WireGuard protocol (fast & secure)

**Warning:** Free VPNs often sell your data!`,
    category: 'Network Security',
    relatedTopics: ['wifi security', 'privacy', 'encryption']
  },

  malware: {
    keywords: ['malware', 'virus', 'trojan', 'ransomware', 'spyware'],
    response: `Malware protection and removal:

**Types of Malware:**
- **Virus:** Replicates and spreads
- **Trojan:** Disguised as legitimate software
- **Ransomware:** Encrypts files for ransom
- **Spyware:** Monitors activity
- **Adware:** Displays unwanted ads
- **Rootkit:** Hides other malware

**Prevention:**
1. Keep software updated
2. Use antivirus/anti-malware
3. Don't download from untrusted sources
4. Enable firewalls
5. Back up data regularly
6. Use standard user accounts (not admin)
7. Be cautious with email attachments
8. Use ad blockers

**If Infected:**
1. Disconnect from internet/network
2. Boot in safe mode
3. Run full system scan
4. Remove detected threats
5. Change all passwords
6. Restore from clean backup if needed

**Recommended Tools:**
- Malwarebytes (scanner)
- Windows Defender (built-in)
- Bitdefender
- Kaspersky`,
    category: 'Malware Defense',
    relatedTopics: ['antivirus', 'ransomware', 'backup']
  },

  backup: {
    keywords: ['backup', 'data backup', 'recovery', 'restore'],
    response: `Data backup best practices:

**3-2-1 Rule:**
- **3** copies of your data
- **2** different storage types
- **1** copy off-site

**Backup Methods:**
1. **Cloud backup** (Google Drive, Dropbox, Backblaze)
2. **External drives** (HDD/SSD)
3. **NAS** (Network Attached Storage)
4. **Encrypted USB drives**

**What to Backup:**
✓ Documents and files
✓ Photos and videos
✓ Email and contacts
✓ Application settings
✓ System configuration
✓ Passwords (encrypted vault)

**Backup Schedule:**
- Critical data: Daily
- Important data: Weekly
- Everything else: Monthly
- Test restores quarterly

**Encryption:**
Always encrypt backups containing sensitive data
- Use BitLocker (Windows)
- Use FileVault (macOS)
- Use VeraCrypt (cross-platform)`,
    category: 'Data Protection',
    relatedTopics: ['encryption', 'ransomware', 'cloud security']
  },

  firewall: {
    keywords: ['firewall', 'network protection', 'port blocking'],
    response: `Firewall configuration guide:

**What is a Firewall?**
Monitors and controls network traffic based on security rules.

**Types:**
1. **Software firewall** (Windows Defender, iptables)
2. **Hardware firewall** (router built-in)
3. **Cloud firewall** (AWS Security Groups)

**Best Practices:**
- Enable default firewalls
- Block all inbound by default
- Allow only necessary outbound
- Close unused ports
- Monitor firewall logs
- Update rules regularly
- Use application-level filtering

**Common Ports:**
- 22: SSH
- 80: HTTP
- 443: HTTPS
- 3389: RDP
- 21: FTP (insecure, avoid)

**Configuration:**
Windows: Settings > Privacy & Security > Windows Security > Firewall
macOS: System Preferences > Security > Firewall
Linux: ufw (Ubuntu) or iptables`,
    category: 'Network Security',
    relatedTopics: ['network security', 'port scanning', 'intrusion detection']
  },

  encryption: {
    keywords: ['encryption', 'encrypt', 'decrypt', 'secure data'],
    response: `Data encryption guide:

**What is Encryption?**
Converting data into unreadable format without decryption key.

**Types:**
1. **At Rest:** Stored data (disk encryption)
2. **In Transit:** Data being transmitted (HTTPS, VPN)
3. **End-to-End:** Only sender/receiver can decrypt

**Encryption Methods:**
- **Symmetric:** Same key for encrypt/decrypt (AES-256)
- **Asymmetric:** Public/private key pair (RSA)

**Full Disk Encryption:**
- Windows: BitLocker
- macOS: FileVault
- Linux: LUKS

**File Encryption:**
- VeraCrypt (open-source)
- 7-Zip with AES-256
- AxCrypt
- Cryptomator (cloud storage)

**Communication Encryption:**
- Signal (messaging)
- ProtonMail (email)
- HTTPS (websites)
- SSH (remote access)

**Best Practices:**
- Use AES-256 minimum
- Strong encryption keys
- Secure key storage
- Regular key rotation`,
    category: 'Cryptography',
    relatedTopics: ['password strength', 'vpn', 'secure communication']
  },

  social_engineering: {
    keywords: ['social engineering', 'manipulation', 'pretexting', 'impersonation'],
    response: `Social engineering attack prevention:

**What is Social Engineering?**
Manipulating people into revealing confidential information.

**Common Tactics:**
- **Phishing:** Fraudulent emails
- **Pretexting:** Fabricated scenarios
- **Baiting:** Offering something enticing
- **Quid Pro Quo:** Offering service for info
- **Tailgating:** Following someone into secure area
- **Impersonation:** Pretending to be someone else

**Red Flags:**
🚩 Urgency/pressure tactics
🚩 Requests for sensitive info
🚩 Unusual requests from "authority"
🚩 Too good to be true offers
🚩 Fear/intimidation tactics

**Protection:**
1. **Verify identity** - Call back on official number
2. **Question requests** - Legitimate orgs won't pressure you
3. **Don't share sensitive info** over phone/email
4. **Train employees** on awareness
5. **Implement verification** protocols
6. **Report suspicious** contacts
7. **Use multi-factor** authentication
8. **Limit public information** sharing`,
    category: 'Human Security',
    relatedTopics: ['phishing', 'security awareness', 'privacy']
  }
}

/**
 * Find best matching topic from knowledge base
 */
function findBestMatch(query: string): {
  topic: string
  confidence: number
} | null {
  const lowerQuery = query.toLowerCase()
  let bestMatch: { topic: string; confidence: number } | null = null
  let highestScore = 0

  for (const [topic, data] of Object.entries(SECURITY_KNOWLEDGE)) {
    let score = 0
    let keywordMatches = 0

    for (const keyword of data.keywords) {
      if (lowerQuery.includes(keyword)) {
        score += keyword.length / lowerQuery.length
        keywordMatches++
      }
    }

    // Bonus for multiple keyword matches
    if (keywordMatches > 1) {
      score *= 1.5
    }

    if (score > highestScore) {
      highestScore = score
      bestMatch = {
        topic,
        confidence: Math.min(100, score * 100)
      }
    }
  }

  return bestMatch && bestMatch.confidence > 20 ? bestMatch : null
}

/**
 * ⚠️ LLM API PLACEHOLDER ⚠️
 *
 * This is where you can integrate an LLM API (OpenAI, Anthropic, etc.)
 * for more sophisticated and context-aware responses.
 *
 * Example integration:
 * ```typescript
 * import { OpenAI } from 'openai'
 *
 * async function queryLLM(query: string) {
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
 *
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [
 *       {
 *         role: 'system',
 *         content: 'You are a cybersecurity expert assistant. Provide accurate, helpful security advice.'
 *       },
 *       { role: 'user', content: query }
 *     ]
 *   })
 *
 *   return response.choices[0].message.content
 * }
 * ```
 */
async function queryLLMAPI(query: string): Promise<string | null> {
  // TODO: Integrate your LLM API here
  // Example:
  // try {
  //   const response = await yourLLMClient.complete(query)
  //   return response.text
  // } catch (error) {
  //   console.error('LLM API error:', error)
  //   return null
  // }

  return null // Return null to use knowledge base fallback
}

/**
 * Generate response from knowledge base
 */
function generateKnowledgeBaseResponse(
  query: string,
  topic: string,
  confidence: number
): SecurityResponse {
  const knowledge = SECURITY_KNOWLEDGE[topic]

  return {
    query,
    answer: knowledge.response,
    category: knowledge.category,
    confidence,
    relatedTopics: knowledge.relatedTopics,
    sources: ['Built-in Security Knowledge Base']
  }
}

/**
 * Generate fallback response for unknown queries
 */
function generateFallbackResponse(query: string): SecurityResponse {
  const generalAdvice = `I don't have specific information about "${query}", but here are some general cybersecurity best practices:

**General Security Principles:**

1. **Keep Software Updated** - Install security patches promptly
2. **Use Strong Authentication** - Complex passwords + 2FA/MFA
3. **Encrypt Sensitive Data** - Both at rest and in transit
4. **Regular Backups** - Follow the 3-2-1 backup rule
5. **Be Suspicious** - Verify requests for sensitive information
6. **Principle of Least Privilege** - Only grant necessary permissions
7. **Monitor and Audit** - Review logs and account activity
8. **Security Awareness** - Stay informed about threats
9. **Network Segmentation** - Isolate sensitive systems
10. **Incident Response Plan** - Prepare for security events

For specific questions, try asking about:
- Wi-Fi security
- Password management
- Phishing protection
- VPN usage
- Malware defense
- Data encryption
- Two-factor authentication

Would you like more information on any of these topics?`

  return {
    query,
    answer: generalAdvice,
    category: 'General Security',
    confidence: 50,
    relatedTopics: [
      'wifi security',
      'password strength',
      'phishing',
      '2fa',
      'malware',
      'encryption'
    ]
  }
}

/**
 * Ask the AI Security Assistant a question
 *
 * This function will:
 * 1. Try to use an LLM API if available
 * 2. Fall back to knowledge base matching
 * 3. Provide general security advice if no match found
 */
export async function askSecurityAssistant(query: string): Promise<SecurityResponse> {
  // Try LLM API first
  const llmResponse = await queryLLMAPI(query)

  if (llmResponse) {
    return {
      query,
      answer: llmResponse,
      category: 'AI Generated',
      confidence: 95,
      relatedTopics: [],
      sources: ['AI Language Model']
    }
  }

  // Fall back to knowledge base
  const match = findBestMatch(query)

  if (match) {
    return generateKnowledgeBaseResponse(query, match.topic, match.confidence)
  }

  // No match found - provide general advice
  return generateFallbackResponse(query)
}

/**
 * Get list of available security topics
 */
export function getAvailableTopics(): Array<{
  topic: string
  category: string
  keywords: string[]
}> {
  return Object.entries(SECURITY_KNOWLEDGE).map(([topic, data]) => ({
    topic,
    category: data.category,
    keywords: data.keywords
  }))
}

/**
 * Get quick security tips
 */
export function getQuickTips(): string[] {
  return [
    'Use unique passwords for each account',
    'Enable 2FA/MFA on all important accounts',
    'Keep your software and OS updated',
    'Be skeptical of unsolicited emails and messages',
    'Use a password manager',
    'Back up your data regularly (3-2-1 rule)',
    'Use a VPN on public Wi-Fi',
    'Verify links before clicking',
    'Use strong encryption for sensitive data',
    'Monitor your accounts for suspicious activity'
  ]
}
