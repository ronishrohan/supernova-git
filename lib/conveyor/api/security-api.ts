/**
 * Security API for Frontend
 *
 * Provides type-safe IPC communication for all security features
 */

import { ConveyorApi } from '@/lib/preload/shared'

export class SecurityApi extends ConveyorApi {
  // Scanner methods
  scanFile = (filePath: string) => this.invoke('scanner-scan-file', filePath)

  scanText = (text: string) => this.invoke('scanner-scan-text', text)

  scanUrl = (url: string) => this.invoke('scanner-scan-url', url)

  getScanHistory = (limit?: number) => this.invoke('scanner-get-history', limit)

  getScanStats = () => this.invoke('scanner-get-stats')

  // Phishing methods
  analyzeEmail = (text: string) => this.invoke('phishing-analyze', text)

  // AI Advisor methods
  askAdvisor = (query: string) => this.invoke('advisor-ask', query)

  getAdvisorTopics = () => this.invoke('advisor-get-topics')

  getSecurityTips = () => this.invoke('advisor-get-tips')

  // Watchdog methods
  startWatchdog = (interval?: number) => this.invoke('watchdog-start', interval)

  stopWatchdog = () => this.invoke('watchdog-stop')

  getSystemStatus = () => this.invoke('watchdog-get-status')

  clearAnomalies = () => this.invoke('watchdog-clear-anomalies')

  // Vault methods - first arg userId (from useAuthStore in renderer)
  saveVault = (userId: string, masterKey: string, entries: any[]) =>
    this.invoke('vault-save', userId, masterKey, entries)

  loadVault = (userId: string, masterKey: string) => this.invoke('vault-load', userId, masterKey)

  addVaultEntry = (userId: string, masterKey: string, entry: any) =>
    this.invoke('vault-add-entry', userId, masterKey, entry)

  updateVaultEntry = (userId: string, masterKey: string, entryId: string, updates: any) =>
    this.invoke('vault-update-entry', userId, masterKey, entryId, updates)

  deleteVaultEntry = (userId: string, masterKey: string, entryId: string) =>
    this.invoke('vault-delete-entry', userId, masterKey, entryId)

  searchVault = (userId: string, masterKey: string, query: string) =>
    this.invoke('vault-search', userId, masterKey, query)

  // Reputation methods
  checkUrlReputation = (url: string) => this.invoke('reputation-check-url', url)

  // Dashboard methods
  getDashboardSnapshot = () => this.invoke('dashboard-get-snapshot')

  getSecurityAlerts = () => this.invoke('dashboard-get-alerts')

  // Network Scanner methods
  getNetworkInfo = () => this.invoke('network-get-info')

  performNetworkScan = (target?: string) => this.invoke('network-scan', target)

  quickNetworkCheck = () => this.invoke('network-quick-check')

  // Auth methods - first arg userId
  registerMasterPassword = (userId: string, password: string) => this.invoke('auth-register', userId, password)

  verifyMasterPassword = (userId: string, password: string) => this.invoke('auth-verify', userId, password)

  hasMasterPassword = (userId: string) => this.invoke('auth-has-password', userId)

  changeMasterPassword = (userId: string, oldPassword: string, newPassword: string) =>
    this.invoke('auth-change-password', userId, oldPassword, newPassword)

  getAuthInfo = (userId: string) => this.invoke('auth-get-info', userId)

  resetMasterPassword = (userId: string) => this.invoke('auth-reset', userId)
}
