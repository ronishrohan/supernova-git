/**
 * Blockchain Proof Module
 *
 * Implements a simple blockchain ledger to verify the integrity of vault data using Supabase.
 * Each time the vault is modified, a hash is stored in the blockchain.
 */

import crypto from 'crypto'
import { supabase, getUserId } from '../supabase/supabase'

export interface Block {
  index: number
  timestamp: string
  dataHash: string
  previousHash: string
  nonce: number
  hash: string
}

export interface Blockchain {
  chain: Block[]
  difficulty: number
}

let blockchain: Blockchain | null = null

/**
 * Calculate SHA-256 hash
 */
function calculateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Calculate block hash with proof-of-work
 */
function calculateBlockHash(block: Omit<Block, 'hash'>): string {
  const blockData = `${block.index}${block.timestamp}${block.dataHash}${block.previousHash}${block.nonce}`
  return calculateHash(blockData)
}

/**
 * Mine a block (find nonce that satisfies difficulty)
 */
function mineBlock(block: Omit<Block, 'hash' | 'nonce'>, difficulty: number): Block {
  let nonce = 0
  let hash = ''
  const target = '0'.repeat(difficulty)

  while (!hash.startsWith(target)) {
    nonce++
    const blockWithNonce = { ...block, nonce }
    hash = calculateBlockHash(blockWithNonce)
  }

  return { ...block, nonce, hash }
}

/**
 * Create genesis block (first block)
 */
function createGenesisBlock(): Block {
  const block = {
    index: 0,
    timestamp: new Date().toISOString(),
    dataHash: 'Genesis Block',
    previousHash: '0',
    nonce: 0
  }

  return {
    ...block,
    hash: calculateBlockHash(block)
  }
}

/**
 * Initialize blockchain
 */
async function initializeBlockchain(userIdParam?: string): Promise<void> {
  try {
    const userId = userIdParam || (await getUserId())

    // Try to load existing blockchain from Supabase
    const { data, error } = await supabase
      .from('blockchain_data')
      .select('blocks')
      .eq('user_id', userId)
      .single()

    if (data && !error) {
      blockchain = {
        chain: data.blocks as Block[],
        difficulty: 2
      }
      console.log('[BLOCKCHAIN] Loaded existing chain with', blockchain.chain.length, 'blocks')
    } else {
      // Create new blockchain
      blockchain = {
        chain: [createGenesisBlock()],
        difficulty: 2 // Number of leading zeros required in hash
      }

      await saveBlockchain(userId)
      console.log('[BLOCKCHAIN] Created new blockchain')
    }
  } catch (error) {
    console.error('[BLOCKCHAIN] Initialization error:', error)
    // Fallback to empty blockchain (not persisted)
    blockchain = {
      chain: [createGenesisBlock()],
      difficulty: 2
    }
  }
}

/**
 * Save blockchain to Supabase
 */
async function saveBlockchain(userIdParam?: string): Promise<void> {
  if (!blockchain) return

  try {
    const userId = userIdParam || (await getUserId())

    const { error } = await supabase.from('blockchain_data').upsert(
      {
        user_id: userId,
        blocks: JSON.parse(JSON.stringify(blockchain.chain)),
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id'
      }
    )

    if (error) {
      console.error('[BLOCKCHAIN] Save error:', error)
    }
  } catch (error) {
    console.error('[BLOCKCHAIN] Save error:', error)
  }
}

/**
 * Get the latest block in the chain
 */
function getLatestBlock(): Block {
  if (!blockchain) {
    throw new Error('Blockchain not initialized')
  }

  return blockchain.chain[blockchain.chain.length - 1]
}

/**
 * Add a new block to the chain
 */
async function addBlock(dataHash: string, userIdParam?: string): Promise<Block> {
  if (!blockchain) {
    await initializeBlockchain(userIdParam)
  }

  const previousBlock = getLatestBlock()

  const newBlock = mineBlock(
    {
      index: previousBlock.index + 1,
      timestamp: new Date().toISOString(),
      dataHash,
      previousHash: previousBlock.hash
    },
    blockchain!.difficulty
  )

  blockchain!.chain.push(newBlock)
  await saveBlockchain(userIdParam)

  return newBlock
}

/**
 * Verify the entire blockchain
 */
function verifyBlockchain(): boolean {
  if (!blockchain || blockchain.chain.length === 0) {
    return false
  }

  // Verify genesis block
  const genesisBlock = blockchain.chain[0]
  if (genesisBlock.previousHash !== '0') {
    return false
  }

  // Verify each block
  for (let i = 1; i < blockchain.chain.length; i++) {
    const currentBlock = blockchain.chain[i]
    const previousBlock = blockchain.chain[i - 1]

    // Verify hash
    const calculatedHash = calculateBlockHash({
      index: currentBlock.index,
      timestamp: currentBlock.timestamp,
      dataHash: currentBlock.dataHash,
      previousHash: currentBlock.previousHash,
      nonce: currentBlock.nonce
    })

    if (currentBlock.hash !== calculatedHash) {
      console.error(`[BLOCKCHAIN] Block ${i} has invalid hash`)
      return false
    }

    // Verify chain link
    if (currentBlock.previousHash !== previousBlock.hash) {
      console.error(`[BLOCKCHAIN] Block ${i} has broken chain link`)
      return false
    }

    // Verify proof-of-work
    const target = '0'.repeat(blockchain.difficulty)
    if (!currentBlock.hash.startsWith(target)) {
      console.error(`[BLOCKCHAIN] Block ${i} doesn't meet difficulty requirement`)
      return false
    }
  }

  return true
}

/**
 * Find a block by data hash
 */
function findBlockByDataHash(dataHash: string): Block | null {
  if (!blockchain) return null

  return blockchain.chain.find((block) => block.dataHash === dataHash) || null
}

/**
 * Store vault proof in blockchain
 *
 * @param vaultData - The encrypted vault data to store proof for
 * @returns The block that was added to the chain
 */
export async function storeVaultProof(vaultData: string, userIdParam?: string): Promise<{
  success: boolean
  block: Block | null
  message: string
}> {
  try {
    const dataHash = calculateHash(vaultData)

    // Check if this data is already in the chain
    const existingBlock = findBlockByDataHash(dataHash)
    if (existingBlock) {
      console.log('[BLOCKCHAIN] ✅ Data already has proof at block', existingBlock.index)
      return {
        success: true,
        block: existingBlock,
        message: `Proof already exists at block ${existingBlock.index}`
      }
    }

  // Add new block
  const block = await addBlock(dataHash, userIdParam)
    console.log('[BLOCKCHAIN] ✅ Proof stored at block', block.index)

    return {
      success: true,
      block,
      message: `Proof stored successfully at block ${block.index}`
    }
  } catch (error) {
    console.error('[BLOCKCHAIN] ❌ Error storing proof:', error)
    return {
      success: false,
      block: null,
      message: `Failed to store proof: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Verify vault proof from blockchain
 *
 * @param vaultData - The encrypted vault data to verify
 * @returns Verification result
 */
export async function verifyVaultProof(vaultData: string): Promise<{
  verified: boolean
  block: Block | null
  message: string
  chainValid: boolean
}> {
  try {
    if (!blockchain) {
      await initializeBlockchain()
    }

    // First, verify the entire blockchain integrity
    const chainValid = verifyBlockchain()

    if (!chainValid) {
      console.error('[BLOCKCHAIN] ❌ Blockchain integrity compromised')
      return {
        verified: false,
        block: null,
        message: 'Blockchain integrity compromised',
        chainValid: false
      }
    }

    // Calculate data hash
    const dataHash = calculateHash(vaultData)

    // Find block with this hash
    const block = findBlockByDataHash(dataHash)

    if (!block) {
      console.warn('[BLOCKCHAIN] ⚠️ No proof found for this data')
      return {
        verified: false,
        block: null,
        message: 'No proof found in blockchain',
        chainValid: true
      }
    }

    console.log('[BLOCKCHAIN] ✅ Verified proof at block', block.index)
    return {
      verified: true,
      block,
      message: `Proof verified at block ${block.index}`,
      chainValid: true
    }
  } catch (error) {
    console.error('[BLOCKCHAIN] ❌ Error verifying proof:', error)
    return {
      verified: false,
      block: null,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      chainValid: false
    }
  }
}

/**
 * Get blockchain info
 */
export async function getBlockchainInfo(): Promise<{
  totalBlocks: number
  latestBlock: Block | null
  chainValid: boolean
  difficulty: number
}> {
  if (!blockchain) {
    await initializeBlockchain()
  }

  return {
    totalBlocks: blockchain!.chain.length,
    latestBlock: getLatestBlock(),
    chainValid: verifyBlockchain(),
    difficulty: blockchain!.difficulty
  }
}

/**
 * Get full blockchain
 */
export async function getBlockchain(): Promise<Blockchain> {
  if (!blockchain) {
    await initializeBlockchain()
  }

  return blockchain!
}

/**
 * Reset blockchain (for testing/development)
 */
export async function resetBlockchain(): Promise<void> {
  blockchain = {
    chain: [createGenesisBlock()],
    difficulty: 2
  }

  await saveBlockchain()
  console.log('[BLOCKCHAIN] Reset to genesis block')
}

// Initialize on module load
initializeBlockchain().catch(console.error)
