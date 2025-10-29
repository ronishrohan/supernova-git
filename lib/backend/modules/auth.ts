/**
 * Authentication Module
 *
 * Handles master password storage with blockchain-based encryption using Supabase
 */

import crypto from 'crypto'
import { storeVaultProof, verifyVaultProof } from './blockchain'
import { supabase, getUserId } from '../supabase/supabase'

interface AuthData {
  passwordHash: string
  salt: string
  iterations: number
  algorithm: string
  blockchainHash: string
  createdAt: string
  lastLogin: string
}

/**
 * Hash password using PBKDF2
 */
function hashPassword(password: string, salt: Buffer, iterations: number): Buffer {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512')
}

/**
 * Encrypt data using blockchain-derived key
 */
function encryptWithBlockchain(data: string, blockchainSeed: string): {
  encrypted: string
  iv: string
  authTag: string
} {
  // Derive key from blockchain seed
  const key = crypto.createHash('sha256').update(blockchainSeed).digest()
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt data using blockchain-derived key
 */
function decryptWithBlockchain(
  encrypted: string,
  iv: string,
  authTag: string,
  blockchainSeed: string
): string {
  const key = crypto.createHash('sha256').update(blockchainSeed).digest()

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Register master password (first-time setup)
 */
export async function registerMasterPassword(password: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    if (password.length < 8) {
      return {
        success: false,
        message: 'Master password must be at least 8 characters'
      }
    }

    const userId = await getUserId()

    // Check if already registered
    const { data: existing } = await supabase
      .from('auth_data')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return {
        success: false,
        message: 'Master password already registered. Use login instead.'
      }
    }

    // Generate salt and hash password
    const salt = crypto.randomBytes(32)
    const iterations = 100000
    const passwordHash = hashPassword(password, salt, iterations)

    // Create blockchain proof
    const blockchainData = `${passwordHash.toString('hex')}-${Date.now()}`
    const blockchainProof = await storeVaultProof(blockchainData)

    if (!blockchainProof.success) {
      return {
        success: false,
        message: 'Failed to create blockchain proof'
      }
    }

    // Store auth data in Supabase
    const { error } = await supabase.from('auth_data').insert({
      user_id: userId,
      password_hash: passwordHash.toString('hex'),
      salt: salt.toString('hex'),
      iterations,
      algorithm: 'pbkdf2-sha512',
      blockchain_hash: blockchainData,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    })

    if (error) {
      console.error('[AUTH] ❌ Supabase error:', error)
      return {
        success: false,
        message: `Registration failed: ${error.message}`
      }
    }

    console.log('[AUTH] ✅ Master password registered and stored on blockchain')

    return {
      success: true,
      message: 'Master password registered successfully'
    }
  } catch (error) {
    console.error('[AUTH] ❌ Registration error:', error)
    return {
      success: false,
      message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Verify master password
 */
export async function verifyMasterPassword(password: string): Promise<{
  success: boolean
  message: string
  blockchainVerified: boolean
}> {
  try {
    const userId = await getUserId()

    // Load auth data from Supabase
    const { data: authData, error } = await supabase
      .from('auth_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !authData) {
      return {
        success: false,
        message: 'No master password found. Please register first.',
        blockchainVerified: false
      }
    }

    // Hash provided password with stored salt
    const salt = Buffer.from(authData.salt, 'hex')
    const passwordHash = hashPassword(password, salt, authData.iterations)

    // Compare hashes
    const storedHash = Buffer.from(authData.password_hash, 'hex')
    if (!crypto.timingSafeEqual(passwordHash, storedHash)) {
      return {
        success: false,
        message: 'Invalid master password',
        blockchainVerified: false
      }
    }

    // Verify blockchain proof
    const blockchainVerification = await verifyVaultProof(authData.blockchain_hash)

    // Update last login
    await supabase
      .from('auth_data')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId)

    console.log(
      `[AUTH] ✅ Master password verified (Blockchain: ${blockchainVerification.verified ? 'VALID' : 'WARNING'})`
    )

    return {
      success: true,
      message: 'Master password verified',
      blockchainVerified: blockchainVerification.verified && blockchainVerification.chainValid
    }
  } catch (error) {
    console.error('[AUTH] ❌ Verification error:', error)
    return {
      success: false,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      blockchainVerified: false
    }
  }
}

/**
 * Check if master password exists
 */
export async function hasMasterPassword(): Promise<boolean> {
  try {
    const userId = await getUserId()
    const { data } = await supabase
      .from('auth_data')
      .select('id')
      .eq('user_id', userId)
      .single()

    return !!data
  } catch {
    return false
  }
}

/**
 * Change master password
 */
export async function changeMasterPassword(
  oldPassword: string,
  newPassword: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Verify old password
    const verification = await verifyMasterPassword(oldPassword)
    if (!verification.success) {
      return {
        success: false,
        message: 'Invalid current password'
      }
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters'
      }
    }

    const userId = await getUserId()

    // Generate new salt and hash
    const salt = crypto.randomBytes(32)
    const iterations = 100000
    const passwordHash = hashPassword(newPassword, salt, iterations)

    // Create new blockchain proof
    const blockchainData = `${passwordHash.toString('hex')}-${Date.now()}`
    const blockchainProof = await storeVaultProof(blockchainData)

    if (!blockchainProof.success) {
      return {
        success: false,
        message: 'Failed to create blockchain proof'
      }
    }

    // Update auth data in Supabase
    const { error } = await supabase
      .from('auth_data')
      .update({
        password_hash: passwordHash.toString('hex'),
        salt: salt.toString('hex'),
        iterations,
        algorithm: 'pbkdf2-sha512',
        blockchain_hash: blockchainData,
        last_login: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      return {
        success: false,
        message: `Failed to update password: ${error.message}`
      }
    }

    console.log('[AUTH] ✅ Master password changed successfully')

    return {
      success: true,
      message: 'Master password changed successfully'
    }
  } catch (error) {
    console.error('[AUTH] ❌ Change password error:', error)
    return {
      success: false,
      message: `Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get auth info (without sensitive data)
 */
export async function getAuthInfo(): Promise<{
  exists: boolean
  createdAt?: string
  lastLogin?: string
  algorithm?: string
  blockchainProtected: boolean
}> {
  try {
    const userId = await getUserId()
    const { data: authData } = await supabase
      .from('auth_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!authData) {
      return {
        exists: false,
        blockchainProtected: false
      }
    }

    // Verify blockchain
    const verification = await verifyVaultProof(authData.blockchain_hash)

    return {
      exists: true,
      createdAt: authData.created_at,
      lastLogin: authData.last_login,
      algorithm: authData.algorithm,
      blockchainProtected: verification.verified && verification.chainValid
    }
  } catch {
    return {
      exists: false,
      blockchainProtected: false
    }
  }
}

/**
 * Reset master password (WARNING: This will delete auth data)
 */
export async function resetMasterPassword(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const userId = await getUserId()
    const { error } = await supabase
      .from('auth_data')
      .delete()
      .eq('user_id', userId)

    if (error) {
      return {
        success: false,
        message: `Reset failed: ${error.message}`
      }
    }

    console.log('[AUTH] ⚠️ Master password reset - auth data deleted')

    return {
      success: true,
      message: 'Master password reset successfully. You can now register a new password.'
    }
  } catch (error) {
    return {
      success: false,
      message: `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
