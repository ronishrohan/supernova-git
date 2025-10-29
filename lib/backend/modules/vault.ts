/**
 * Password Vault Module
 *
 * Secure password storage with AES-256 encryption and blockchain verification using Supabase.
 */

import crypto from 'crypto'
import { randomUUID } from 'crypto'
import { storeVaultProof, verifyVaultProof } from './blockchain'
import { supabase, getUserId } from '../supabase/supabase'

export interface VaultEntry {
  id: string
  site: string
  username: string
  password: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface EncryptedVault {
  data: string // Encrypted JSON
  iv: string // Initialization vector
  salt: string // Password derivation salt
  version: number
}

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64
const AUTH_TAG_LENGTH = 16

/**
 * Derive encryption key from master password using PBKDF2
 */
function deriveKey(masterPassword: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterPassword, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt vault data
 */
function encryptData(data: string, masterPassword: string): EncryptedVault {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key from master password
  const key = deriveKey(masterPassword, salt)

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get auth tag
  const authTag = cipher.getAuthTag()

  // Combine encrypted data with auth tag
  const encryptedWithTag = encrypted + authTag.toString('hex')

  return {
    data: encryptedWithTag,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    version: 1
  }
}

/**
 * Decrypt vault data
 */
function decryptData(encrypted: EncryptedVault, masterPassword: string): string {
  try {
    // Parse hex strings back to buffers
    const salt = Buffer.from(encrypted.salt, 'hex')
    const iv = Buffer.from(encrypted.iv, 'hex')

    // Derive key
    const key = deriveKey(masterPassword, salt)

    // Separate auth tag from encrypted data
    const encryptedData = encrypted.data.slice(0, -AUTH_TAG_LENGTH * 2)
    const authTag = Buffer.from(encrypted.data.slice(-AUTH_TAG_LENGTH * 2), 'hex')

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Decryption failed: Invalid master password or corrupted data')
  }
}

/**
 * Save vault to Supabase
 */
async function saveVaultToSupabase(encrypted: EncryptedVault): Promise<void> {
  try {
    const userId = await getUserId()

    // Extract auth tag from data (last 32 hex chars = 16 bytes)
    const authTag = encrypted.data.slice(-32)
    const encryptedData = encrypted.data.slice(0, -32)

    const { error } = await supabase.from('vault_data').upsert(
      {
        user_id: userId,
        encrypted_data: encryptedData,
        iv: encrypted.iv,
        auth_tag: authTag,
        blockchain_hash: encrypted.salt, // Store salt in blockchain_hash field
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id'
      }
    )

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }
  } catch (error) {
    throw new Error(`Failed to save vault: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Load vault from Supabase
 */
async function loadVaultFromSupabase(): Promise<EncryptedVault | null> {
  try {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('vault_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    // Reconstruct encrypted vault
    return {
      data: data.encrypted_data + data.auth_tag,
      iv: data.iv,
      salt: data.blockchain_hash, // Salt stored in blockchain_hash field
      version: 1
    }
  } catch {
    return null
  }
}

/**
 * Save vault entries (encrypt and store with blockchain proof)
 */
export async function saveVault(
  masterKey: string,
  entries: VaultEntry[]
): Promise<{
  success: boolean
  message: string
  blockchainProof?: {
    stored: boolean
    blockIndex?: number
  }
}> {
  try {
    // Validate master key
    if (!masterKey || masterKey.length < 8) {
      throw new Error('Master password must be at least 8 characters')
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.site || !entry.username || !entry.password) {
        throw new Error('Each entry must have site, username, and password')
      }
    }

    // Encrypt vault data
    const vaultData = JSON.stringify(entries)
    const encrypted = encryptData(vaultData, masterKey)

    // Save to Supabase
    await saveVaultToSupabase(encrypted)

    // Store blockchain proof
    const encryptedString = JSON.stringify(encrypted)
    const proofResult = await storeVaultProof(encryptedString)

    console.log('[VAULT] ✅ Vault saved successfully')

    return {
      success: true,
      message: 'Vault saved successfully',
      blockchainProof: {
        stored: proofResult.success,
        blockIndex: proofResult.block?.index
      }
    }
  } catch (error) {
    console.error('[VAULT] ❌ Error saving vault:', error)
    return {
      success: false,
      message: `Failed to save vault: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Load vault entries (verify and decrypt)
 */
export async function loadVault(masterKey: string): Promise<{
  success: boolean
  entries: VaultEntry[]
  message: string
  blockchainVerification?: {
    verified: boolean
    blockIndex?: number
    chainValid: boolean
  }
}> {
  try {
    // Load encrypted vault
    const encrypted = await loadVaultFromSupabase()

    if (!encrypted) {
      return {
        success: true,
        entries: [],
        message: 'No vault found, starting with empty vault'
      }
    }

    // Verify blockchain proof
    const encryptedString = JSON.stringify(encrypted)
    const verification = await verifyVaultProof(encryptedString)

    if (!verification.chainValid) {
      console.warn('[VAULT] ⚠️ Blockchain integrity compromised')
    }

    if (!verification.verified) {
      console.warn('[VAULT] ⚠️ Vault data not found in blockchain')
    }

    // Decrypt vault
    const decryptedData = decryptData(encrypted, masterKey)
    const entries = JSON.parse(decryptedData) as VaultEntry[]

    console.log('[VAULT] ✅ Vault loaded successfully')

    return {
      success: true,
      entries,
      message: `Vault loaded successfully (${entries.length} entries)`,
      blockchainVerification: {
        verified: verification.verified,
        blockIndex: verification.block?.index,
        chainValid: verification.chainValid
      }
    }
  } catch (error) {
    console.error('[VAULT] ❌ Error loading vault:', error)

    if (error instanceof Error && error.message.includes('Decryption failed')) {
      return {
        success: false,
        entries: [],
        message: 'Invalid master password'
      }
    }

    return {
      success: false,
      entries: [],
      message: `Failed to load vault: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Add entry to vault
 */
export async function addVaultEntry(
  masterKey: string,
  entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{
  success: boolean
  entry?: VaultEntry
  message: string
}> {
  try {
    // Load existing vault
    const loadResult = await loadVault(masterKey)

    if (!loadResult.success && loadResult.entries.length === 0 && loadResult.message !== 'No vault found, starting with empty vault') {
      return {
        success: false,
        message: loadResult.message
      }
    }

    const entries = loadResult.entries

    // Create new entry
    const newEntry: VaultEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to entries
    entries.push(newEntry)

    // Save vault
    const saveResult = await saveVault(masterKey, entries)

    if (!saveResult.success) {
      return {
        success: false,
        message: saveResult.message
      }
    }

    return {
      success: true,
      entry: newEntry,
      message: 'Entry added successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to add entry: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update vault entry
 */
export async function updateVaultEntry(
  masterKey: string,
  entryId: string,
  updates: Partial<Omit<VaultEntry, 'id' | 'createdAt'>>
): Promise<{
  success: boolean
  entry?: VaultEntry
  message: string
}> {
  try {
    // Load existing vault
    const loadResult = await loadVault(masterKey)

    if (!loadResult.success) {
      return {
        success: false,
        message: loadResult.message
      }
    }

    const entries = loadResult.entries

    // Find entry
    const entryIndex = entries.findIndex((e) => e.id === entryId)

    if (entryIndex === -1) {
      return {
        success: false,
        message: 'Entry not found'
      }
    }

    // Update entry
    const updatedEntry: VaultEntry = {
      ...entries[entryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    entries[entryIndex] = updatedEntry

    // Save vault
    const saveResult = await saveVault(masterKey, entries)

    if (!saveResult.success) {
      return {
        success: false,
        message: saveResult.message
      }
    }

    return {
      success: true,
      entry: updatedEntry,
      message: 'Entry updated successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to update entry: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete vault entry
 */
export async function deleteVaultEntry(
  masterKey: string,
  entryId: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Load existing vault
    const loadResult = await loadVault(masterKey)

    if (!loadResult.success) {
      return {
        success: false,
        message: loadResult.message
      }
    }

    const entries = loadResult.entries

    // Find and remove entry
    const entryIndex = entries.findIndex((e) => e.id === entryId)

    if (entryIndex === -1) {
      return {
        success: false,
        message: 'Entry not found'
      }
    }

    entries.splice(entryIndex, 1)

    // Save vault
    const saveResult = await saveVault(masterKey, entries)

    if (!saveResult.success) {
      return {
        success: false,
        message: saveResult.message
      }
    }

    return {
      success: true,
      message: 'Entry deleted successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Search vault entries
 */
export async function searchVault(
  masterKey: string,
  query: string
): Promise<{
  success: boolean
  entries: VaultEntry[]
  message: string
}> {
  try {
    const loadResult = await loadVault(masterKey)

    if (!loadResult.success) {
      return {
        success: false,
        entries: [],
        message: loadResult.message
      }
    }

    const lowerQuery = query.toLowerCase()
    const matchedEntries = loadResult.entries.filter(
      (entry) =>
        entry.site.toLowerCase().includes(lowerQuery) ||
        entry.username.toLowerCase().includes(lowerQuery) ||
        (entry.notes && entry.notes.toLowerCase().includes(lowerQuery))
    )

    return {
      success: true,
      entries: matchedEntries,
      message: `Found ${matchedEntries.length} matching entries`
    }
  } catch (error) {
    return {
      success: false,
      entries: [],
      message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Change master password
 */
export async function changeMasterPassword(
  oldMasterKey: string,
  newMasterKey: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Validate new master key
    if (!newMasterKey || newMasterKey.length < 8) {
      throw new Error('New master password must be at least 8 characters')
    }

    // Load with old password
    const loadResult = await loadVault(oldMasterKey)

    if (!loadResult.success) {
      return {
        success: false,
        message: 'Invalid old master password'
      }
    }

    // Save with new password
    const saveResult = await saveVault(newMasterKey, loadResult.entries)

    return saveResult
  } catch (error) {
    return {
      success: false,
      message: `Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Export vault (decrypted JSON)
 */
export async function exportVault(
  masterKey: string
): Promise<{
  success: boolean
  data?: string
  message: string
}> {
  try {
    const loadResult = await loadVault(masterKey)

    if (!loadResult.success) {
      return {
        success: false,
        message: loadResult.message
      }
    }

    return {
      success: true,
      data: JSON.stringify(loadResult.entries, null, 2),
      message: 'Vault exported successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Import vault (merge with existing)
 */
export async function importVault(
  masterKey: string,
  importData: string
): Promise<{
  success: boolean
  imported: number
  message: string
}> {
  try {
    // Parse import data
    const importedEntries = JSON.parse(importData) as VaultEntry[]

    // Validate
    if (!Array.isArray(importedEntries)) {
      throw new Error('Invalid import data format')
    }

    // Load existing vault
    const loadResult = await loadVault(masterKey)
    const existingEntries = loadResult.success ? loadResult.entries : []

    // Merge (avoiding duplicates by site+username)
    const merged = [...existingEntries]
    let importCount = 0

    for (const entry of importedEntries) {
      const exists = merged.some(
        (e) => e.site === entry.site && e.username === entry.username
      )

      if (!exists) {
        merged.push({
          ...entry,
          id: randomUUID(),
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        importCount++
      }
    }

    // Save merged vault
    const saveResult = await saveVault(masterKey, merged)

    if (!saveResult.success) {
      return {
        success: false,
        imported: 0,
        message: saveResult.message
      }
    }

    return {
      success: true,
      imported: importCount,
      message: `Imported ${importCount} new entries`
    }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
