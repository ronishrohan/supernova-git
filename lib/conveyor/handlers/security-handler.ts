/**
 * Security IPC Handlers
 *
 * Registers all IPC handlers for security modules in the main process
 */

import { handle } from '@/lib/main/shared'

// Import all backend modules
import {
  scanFile,
  scanText,
  scanUrl,
  getScanHistory,
  getScanStats
} from '@/lib/backend/modules/scanner'

import { analyzeEmail } from '@/lib/backend/modules/phishing'

import {
  askSecurityAssistant,
  getAvailableTopics,
  getQuickTips
} from '@/lib/backend/modules/advisor'

import {
  startWatchdog,
  stopWatchdog,
  getSystemStatus,
  clearAnomalies
} from '@/lib/backend/modules/watchdog'

import {
  saveVault,
  loadVault,
  addVaultEntry,
  updateVaultEntry,
  deleteVaultEntry,
  searchVault
} from '@/lib/backend/modules/vault'

import { checkUrlReputation } from '@/lib/backend/modules/reputation'

import {
  getDashboardSnapshot,
  getSecurityAlerts
} from '@/lib/backend/modules/dashboard'

import {
  getNetworkInfo,
  performNetworkScan,
  quickNetworkCheck
} from '@/lib/backend/modules/network-scanner'

import {
  registerMasterPassword,
  verifyMasterPassword,
  hasMasterPassword,
  changeMasterPassword,
  getAuthInfo,
  resetMasterPassword
} from '@/lib/backend/modules/auth'

/**
 * Register all security-related IPC handlers
 */
export const registerSecurityHandlers = () => {
  // Start watchdog automatically on launch
  console.log('[SECURITY] Starting system watchdog...')
  startWatchdog(5000) // Poll every 5 seconds

  // Scanner handlers
  handle('scanner-scan-file', async (filePath: string) => {
    return await scanFile(filePath)
  })

  handle('scanner-scan-text', async (text: string) => {
    return await scanText(text)
  })

  handle('scanner-scan-url', async (url: string) => {
    return await scanUrl(url)
  })

  handle('scanner-get-history', async (limit?: number) => {
    return await getScanHistory(limit)
  })

  handle('scanner-get-stats', async () => {
    return await getScanStats()
  })

  // Phishing handlers
  handle('phishing-analyze', async (text: string) => {
    return await analyzeEmail(text)
  })

  // AI Advisor handlers
  handle('advisor-ask', async (query: string) => {
    return await askSecurityAssistant(query)
  })

  handle('advisor-get-topics', async () => {
    return getAvailableTopics()
  })

  handle('advisor-get-tips', async () => {
    return getQuickTips()
  })

  // Watchdog handlers
  handle('watchdog-start', async (interval?: number) => {
    startWatchdog(interval)
  })

  handle('watchdog-stop', async () => {
    stopWatchdog()
  })

  handle('watchdog-get-status', async () => {
    return await getSystemStatus()
  })

  handle('watchdog-clear-anomalies', async () => {
    clearAnomalies()
  })

  // Vault handlers
  handle('vault-save', async (masterKey: string, entries: any[]) => {
    return await saveVault(masterKey, entries)
  })

  handle('vault-load', async (masterKey: string) => {
    return await loadVault(masterKey)
  })

  handle('vault-add-entry', async (masterKey: string, entry: any) => {
    return await addVaultEntry(masterKey, entry)
  })

  handle('vault-update-entry', async (masterKey: string, entryId: string, updates: any) => {
    return await updateVaultEntry(masterKey, entryId, updates)
  })

  handle('vault-delete-entry', async (masterKey: string, entryId: string) => {
    return await deleteVaultEntry(masterKey, entryId)
  })

  handle('vault-search', async (masterKey: string, query: string) => {
    return await searchVault(masterKey, query)
  })

  // Reputation handlers
  handle('reputation-check-url', async (url: string) => {
    return await checkUrlReputation(url)
  })

  // Dashboard handlers
  handle('dashboard-get-snapshot', async () => {
    return await getDashboardSnapshot()
  })

  handle('dashboard-get-alerts', async () => {
    return await getSecurityAlerts()
  })

  // Network Scanner handlers
  handle('network-get-info', async () => {
    return await getNetworkInfo()
  })

  handle('network-scan', async (target?: string) => {
    return await performNetworkScan(target)
  })

  handle('network-quick-check', async () => {
    return await quickNetworkCheck()
  })

  // Auth handlers
  handle('auth-register', async (password: string) => {
    return await registerMasterPassword(password)
  })

  handle('auth-verify', async (password: string) => {
    return await verifyMasterPassword(password)
  })

  handle('auth-has-password', async () => {
    return await hasMasterPassword()
  })

  handle('auth-change-password', async (oldPassword: string, newPassword: string) => {
    return await changeMasterPassword(oldPassword, newPassword)
  })

  handle('auth-get-info', async () => {
    return await getAuthInfo()
  })

  handle('auth-reset', async () => {
    return await resetMasterPassword()
  })

  console.log('[SECURITY] All security handlers registered')
}
