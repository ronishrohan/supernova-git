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

  // Vault methods
  saveVault = (masterKey: string, entries: any[]) =>
    this.invoke('vault-save', masterKey, entries)

  loadVault = (masterKey: string) => this.invoke('vault-load', masterKey)

  addVaultEntry = (masterKey: string, entry: any) =>
    this.invoke('vault-add-entry', masterKey, entry)

  updateVaultEntry = (masterKey: string, entryId: string, updates: any) =>
    this.invoke('vault-update-entry', masterKey, entryId, updates)

  deleteVaultEntry = (masterKey: string, entryId: string) =>
    this.invoke('vault-delete-entry', masterKey, entryId)

  searchVault = (masterKey: string, query: string) =>
    this.invoke('vault-search', masterKey, query)

  // Reputation methods
  checkUrlReputation = (url: string) => this.invoke('reputation-check-url', url)

  // Dashboard methods
  getDashboardSnapshot = () => this.invoke('dashboard-get-snapshot')

  getSecurityAlerts = () => this.invoke('dashboard-get-alerts')

  // Network Scanner methods
  getNetworkInfo = () => this.invoke('network-get-info')

  performNetworkScan = (target?: string) => this.invoke('network-scan', target)

  quickNetworkCheck = () => this.invoke('network-quick-check')

  // Auth methods
  registerMasterPassword = (password: string) => this.invoke('auth-register', password)

  verifyMasterPassword = (password: string) => this.invoke('auth-verify', password)

  hasMasterPassword = () => this.invoke('auth-has-password')

  changeMasterPassword = (oldPassword: string, newPassword: string) =>
    this.invoke('auth-change-password', oldPassword, newPassword)

  getAuthInfo = () => this.invoke('auth-get-info')

  resetMasterPassword = () => this.invoke('auth-reset')
}
