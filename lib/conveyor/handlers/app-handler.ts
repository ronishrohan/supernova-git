import { type App } from 'electron'
import { handle } from '@/lib/main/shared'
import { runVaultTest } from '@/lib/backend/password-checker-hash/test'
import { runBlockchainTest } from '@/lib/backend/password-checker-hash/blockchain'

export const registerAppHandlers = (app: App) => {
  // App operations
  handle('version', () => app.getVersion())
  // Run a small vault save/load test and return the saved entries
  handle('run-vault-test', () => runVaultTest())
  // Run blockchain mock test (store proof and verify)
  handle('run-blockchain-test', () => runBlockchainTest())
}
