/**
 * Security IPC Schemas
 *
 * Zod schemas for all security-related IPC channels
 */

import { z } from 'zod'

// Scanner schemas
export const scannerIpcSchema = {
  'scanner-scan-file': {
    args: z.tuple([z.string()]),
    return: z.object({
      score: z.number(),
      verdict: z.enum(['clean', 'suspicious', 'malicious']),
      reasons: z.array(z.string()),
      id: z.string(),
      timestamp: z.string(),
      scanType: z.enum(['file', 'text', 'url']),
      target: z.string()
    })
  },
  'scanner-scan-text': {
    args: z.tuple([z.string()]),
    return: z.object({
      score: z.number(),
      verdict: z.enum(['clean', 'suspicious', 'malicious']),
      reasons: z.array(z.string()),
      id: z.string(),
      timestamp: z.string(),
      scanType: z.enum(['file', 'text', 'url']),
      target: z.string()
    })
  },
  'scanner-scan-url': {
    args: z.tuple([z.string()]),
    return: z.object({
      score: z.number(),
      verdict: z.enum(['clean', 'suspicious', 'malicious']),
      reasons: z.array(z.string()),
      id: z.string(),
      timestamp: z.string(),
      scanType: z.enum(['file', 'text', 'url']),
      target: z.string()
    })
  },
  'scanner-get-history': {
    args: z.tuple([z.number().optional()]),
    return: z.array(
      z.object({
        score: z.number(),
        verdict: z.enum(['clean', 'suspicious', 'malicious']),
        reasons: z.array(z.string()),
        id: z.string(),
        timestamp: z.string(),
        scanType: z.enum(['file', 'text', 'url']),
        target: z.string()
      })
    )
  },
  'scanner-get-stats': {
    args: z.tuple([]),
    return: z.object({
      totalScans: z.number(),
      cleanCount: z.number(),
      suspiciousCount: z.number(),
      maliciousCount: z.number(),
      lastScanTime: z.string().nullable()
    })
  }
}

// Phishing schemas
export const phishingIpcSchema = {
  'phishing-analyze': {
    args: z.tuple([z.string()]),
    return: z.object({
      label: z.enum(['safe', 'suspicious', 'malicious']),
      score: z.number(),
      probabilities: z.record(z.number()),
      explanation: z.string(),
      features: z.array(z.string())
    })
  }
}

// AI Advisor schemas
export const advisorIpcSchema = {
  'advisor-ask': {
    args: z.tuple([z.string()]),
    return: z.object({
      query: z.string(),
      answer: z.string(),
      category: z.string(),
      confidence: z.number(),
      relatedTopics: z.array(z.string()),
      sources: z.array(z.string()).optional()
    })
  },
  'advisor-get-topics': {
    args: z.tuple([]),
    return: z.array(
      z.object({
        topic: z.string(),
        category: z.string(),
        keywords: z.array(z.string())
      })
    )
  },
  'advisor-get-tips': {
    args: z.tuple([]),
    return: z.array(z.string())
  }
}

// Watchdog schemas
export const watchdogIpcSchema = {
  'watchdog-start': {
    args: z.tuple([z.number().optional()]),
    return: z.void()
  },
  'watchdog-stop': {
    args: z.tuple([]),
    return: z.void()
  },
  'watchdog-get-status': {
    args: z.tuple([]),
    return: z.object({
      current: z
        .object({
          cpu: z.number(),
          memory: z.number(),
          disk: z.number(),
          netIn: z.number(),
          netOut: z.number(),
          processes: z.number(),
          uptime: z.number(),
          timestamp: z.string()
        })
        .nullable(),
      isRunning: z.boolean(),
      history: z.array(
        z.object({
          cpu: z.number(),
          memory: z.number(),
          disk: z.number(),
          netIn: z.number(),
          netOut: z.number(),
          processes: z.number(),
          uptime: z.number(),
          timestamp: z.string()
        })
      ),
      anomalies: z.array(
        z.object({
          time: z.string(),
          type: z.string(),
          severity: z.enum(['low', 'medium', 'high', 'critical']),
          details: z.string(),
          metric: z.string(),
          value: z.number(),
          threshold: z.number()
        })
      ),
      baselineEstablished: z.boolean(),
      healthScore: z.number()
    })
  },
  'watchdog-clear-anomalies': {
    args: z.tuple([]),
    return: z.void()
  }
}

// Vault schemas
export const vaultIpcSchema = {
  'vault-save': {
    // args: [userId, masterKey, entries]
    args: z.tuple([
      z.string(),
      z.string(),
      z.array(
        z.object({
          id: z.string(),
          site: z.string(),
          username: z.string(),
          password: z.string(),
          notes: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
      )
    ]),
    return: z.object({
      success: z.boolean(),
      message: z.string(),
      blockchainProof: z
        .object({
          stored: z.boolean(),
          blockIndex: z.number().optional()
        })
        .optional()
    })
  },
  'vault-load': {
    // args: [userId, masterKey]
    args: z.tuple([z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      entries: z.array(
        z.object({
          id: z.string(),
          site: z.string(),
          username: z.string(),
          password: z.string(),
          notes: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
      ),
      message: z.string(),
      blockchainVerification: z
        .object({
          verified: z.boolean(),
          blockIndex: z.number().optional(),
          chainValid: z.boolean()
        })
        .optional()
    })
  },
  'vault-add-entry': {
    // args: [userId, masterKey, entry]
    args: z.tuple([
      z.string(),
      z.string(),
      z.object({
        site: z.string(),
        username: z.string(),
        password: z.string(),
        notes: z.string().optional()
      })
    ]),
    return: z.object({
      success: z.boolean(),
      entry: z
        .object({
          id: z.string(),
          site: z.string(),
          username: z.string(),
          password: z.string(),
          notes: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
        .optional(),
      message: z.string()
    })
  },
  'vault-update-entry': {
    // args: [userId, masterKey, entryId, updates]
    args: z.tuple([
      z.string(),
      z.string(),
      z.string(),
      z.object({
        site: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        notes: z.string().optional()
      })
    ]),
    return: z.object({
      success: z.boolean(),
      entry: z
        .object({
          id: z.string(),
          site: z.string(),
          username: z.string(),
          password: z.string(),
          notes: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
        .optional(),
      message: z.string()
    })
  },
  'vault-delete-entry': {
    // args: [userId, masterKey, entryId]
    args: z.tuple([z.string(), z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  'vault-search': {
    // args: [userId, masterKey, query]
    args: z.tuple([z.string(), z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      entries: z.array(
        z.object({
          id: z.string(),
          site: z.string(),
          username: z.string(),
          password: z.string(),
          notes: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
      ),
      message: z.string()
    })
  }
}

// Reputation schemas
export const reputationIpcSchema = {
  'reputation-check-url': {
    args: z.tuple([z.string()]),
    return: z.object({
      url: z.string(),
      score: z.number(),
      risk: z.enum(['safe', 'low', 'medium', 'high', 'critical']),
      checks: z.array(
        z.object({
          name: z.string(),
          passed: z.boolean(),
          weight: z.number(),
          details: z.string()
        })
      ),
      recommendation: z.string(),
      timestamp: z.string()
    })
  }
}

// Dashboard schemas
export const dashboardIpcSchema = {
  'dashboard-get-snapshot': {
    args: z.tuple([z.string().optional()]),
    return: z.object({
      systemHealth: z.object({
        score: z.number(),
        status: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
        cpu: z.number(),
        memory: z.number(),
        disk: z.number(),
        isMonitoring: z.boolean()
      }),
      scans: z.object({
        totalScans: z.number(),
        cleanCount: z.number(),
        suspiciousCount: z.number(),
        maliciousCount: z.number(),
        lastScanTime: z.string().nullable(),
        recentScans: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            verdict: z.string(),
            timestamp: z.string()
          })
        )
      }),
      vault: z.object({
        isProtected: z.boolean(),
        blockchainVerified: z.boolean(),
        totalBlocks: z.number(),
        lastVerification: z.string().nullable()
      }),
      watchdog: z.object({
        totalReadings: z.number(),
        totalAnomalies: z.number(),
        criticalAnomalies: z.number(),
        avgCpu: z.number(),
        avgMemory: z.number()
      }),
      breaches: z
        .object({
          email: z.string(),
          breachCount: z.number(),
          breaches: z.array(z.string()),
          status: z.string()
        })
        .nullable(),
      timestamp: z.string()
    })
  },
  'dashboard-get-alerts': {
    args: z.tuple([]),
    return: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        message: z.string(),
        timestamp: z.string()
      })
    )
  }
}

// Network Scanner schemas
export const networkIpcSchema = {
  'network-get-info': {
    args: z.tuple([]),
    return: z.object({
      localIP: z.string(),
      publicIP: z.string().nullable(),
      gateway: z.string().nullable(),
      subnet: z.string(),
      macAddress: z.string().nullable(),
      interfaceName: z.string()
    })
  },
  'network-scan': {
    args: z.tuple([z.string().optional()]),
    return: z.object({
      id: z.string(),
      target: z.string(),
      networkInfo: z.object({
        localIP: z.string(),
        publicIP: z.string().nullable(),
        gateway: z.string().nullable(),
        subnet: z.string(),
        macAddress: z.string().nullable(),
        interfaceName: z.string()
      }),
      openPorts: z.array(
        z.object({
          port: z.number(),
          status: z.enum(['open', 'closed', 'filtered']),
          service: z.string(),
          protocol: z.string()
        })
      ),
      vulnerabilities: z.array(
        z.object({
          severity: z.enum(['low', 'medium', 'high', 'critical']),
          title: z.string(),
          description: z.string(),
          port: z.number().optional()
        })
      ),
      devices: z.array(
        z.object({
          ip: z.string(),
          hostname: z.string().nullable(),
          mac: z.string().nullable(),
          status: z.enum(['online', 'offline'])
        })
      ),
      summary: z.string(),
      timestamp: z.string(),
      duration: z.number()
    })
  },
  'network-quick-check': {
    args: z.tuple([]),
    return: z.object({
      connected: z.boolean(),
      localIP: z.string(),
      publicIP: z.string().nullable(),
      gateway: z.string().nullable(),
      dnsWorking: z.boolean()
    })
  }
}

// Email Analyzer schemas
export const emailAnalyzerIpcSchema = {
  'email-analyzer-analyze': {
    args: z.tuple([z.string()]),
    return: z.object({
      isScam: z.boolean(),
      probability: z.number(),
      riskLevel: z.enum(['safe', 'low', 'medium', 'high', 'critical']),
      indicators: z.array(
        z.object({
          name: z.string(),
          severity: z.enum(['safe', 'low', 'medium', 'high', 'critical']),
          description: z.string()
        })
      ),
      verdict: z.string(),
      timestamp: z.string()
    })
  }
}

// Auth schemas
export const authIpcSchema = {
  'auth-register': {
    // args: [userId, password]
    args: z.tuple([z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  'auth-verify': {
    // args: [userId, password]
    args: z.tuple([z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      message: z.string(),
      blockchainVerified: z.boolean()
    })
  },
  'auth-has-password': {
    // args: [userId]
    args: z.tuple([z.string()]),
    return: z.boolean()
  },
  'auth-change-password': {
    // args: [userId, oldPassword, newPassword]
    args: z.tuple([z.string(), z.string(), z.string()]),
    return: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  'auth-get-info': {
    // args: [userId]
    args: z.tuple([z.string()]),
    return: z.object({
      exists: z.boolean(),
      createdAt: z.string().optional(),
      lastLogin: z.string().optional(),
      algorithm: z.string().optional(),
      blockchainProtected: z.boolean()
    })
  },
  'auth-reset': {
    // args: [userId]
    args: z.tuple([z.string()]),
    return: z.object({
      success: z.boolean(),
      message: z.string()
    })
  }
}
