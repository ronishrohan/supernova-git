import React, { useState, useEffect } from 'react'
import { Asterisk, Plus, Eye, EyeOff, Copy, Lock, Unlock, Edit2, Trash2, Save, X, Shield, CheckCircle } from 'lucide-react'
import { useConveyor } from '../../hooks/use-conveyor'
import { useAuthStore } from '../../store/authStore'

interface VaultEntry {
  id: string
  site: string
  username: string
  password: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function Vault() {
  const conveyor = useConveyor('security')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [visibleIds, setVisibleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [blockchainVerified, setBlockchainVerified] = useState(false)
  const [hasMasterPassword, setHasMasterPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // New entry form
  const [newEntry, setNewEntry] = useState({ site: '', username: '', password: '', notes: '' })

  const { isAuthenticated, user } = useAuthStore()

  // Check if master password exists on mount (only when authenticated)
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !user?.id) {
        setHasMasterPassword(false)
        setIsRegistering(true)
        return
      }
      const hasPassword = await conveyor.hasMasterPassword(user.id)
      setHasMasterPassword(hasPassword)
      setIsRegistering(!hasPassword)
    }
    checkAuth()
  }, [isAuthenticated, user])

  const handleUnlock = async () => {
    if (!masterPassword) {
      alert('Please enter master password')
      return
    }

    if (masterPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      // If registering, create new master password
      if (isRegistering) {
        if (!isAuthenticated || !user?.id) {
          alert('You must be signed in to register a master password')
          setLoading(false)
          return
        }

        const registerResult = await conveyor.registerMasterPassword(user.id, masterPassword)
        if (!registerResult.success) {
          alert(registerResult.message)
          setLoading(false)
          return
        }
        setHasMasterPassword(true)
        setIsRegistering(false)
        // For new users, load empty vault
        setEntries([])
        setIsUnlocked(true)
        setBlockchainVerified(true)
        alert('Master password registered successfully! Vault is ready to use.')
      } else {
        // Verify existing master password
        if (!isAuthenticated || !user?.id) {
          alert('You must be signed in to verify master password')
          setLoading(false)
          return
        }

        const verifyResult = await conveyor.verifyMasterPassword(user.id, masterPassword)
        if (!verifyResult.success) {
          alert(verifyResult.message)
          setLoading(false)
          return
        }
        setBlockchainVerified(verifyResult.blockchainVerified)

        // Load vault for existing users
  const result = await conveyor.loadVault(user.id, masterPassword)

        if (result.success) {
          setEntries(result.entries)
          setIsUnlocked(true)
          alert(`Vault unlocked! ${result.entries.length} entries loaded.`)
        } else {
          alert(result.message)
        }
      }
    } catch (error) {
      alert('Failed to unlock vault: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleLock = () => {
    setIsUnlocked(false)
    setEntries([])
    setMasterPassword('')
    setVisibleIds([])
    setBlockchainVerified(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!isAuthenticated || !user?.id) {
        alert('You must be signed in to save the vault')
        setLoading(false)
        return
      }

      const result = await conveyor.saveVault(user.id, masterPassword, entries)
      if (result.success) {
        setBlockchainVerified(result.blockchainProof?.stored || false)
        alert('Vault saved and verified on blockchain!')
      } else {
        alert('Failed to save: ' + result.message)
      }
    } catch (error) {
      alert('Save error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.site || !newEntry.username || !newEntry.password) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (!isAuthenticated || !user?.id) {
        alert('You must be signed in to add entries')
        setLoading(false)
        return
      }

      const result = await conveyor.addVaultEntry(user.id, masterPassword, newEntry)
      if (result.success && result.entry) {
        setEntries([...entries, result.entry])
        setNewEntry({ site: '', username: '', password: '', notes: '' })
        setShowAddModal(false)
        alert('Entry added successfully!')
      } else {
        alert('Failed to add entry: ' + result.message)
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    setLoading(true)
    try {
      if (!isAuthenticated || !user?.id) {
        alert('You must be signed in to delete entries')
        setLoading(false)
        return
      }

      const result = await conveyor.deleteVaultEntry(user.id, masterPassword, id)
      if (result.success) {
        setEntries(entries.filter((e) => e.id !== id))
        alert('Entry deleted successfully!')
      } else {
        alert('Failed to delete: ' + result.message)
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = (id: string) => {
    setVisibleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Unlock screen
  if (!isUnlocked) {
    return (
      <div className="size-full p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border p-8 text-center">
            <Lock className="mx-auto mb-4 text-primary" size={64} strokeWidth={1} />
            <h1 className="text-3xl font-logo font-light tracking-tighter mb-2">Password Vault</h1>
            <p className="text-gray-600 mb-6">
              {isRegistering
                ? 'Create your master password to secure your vault'
                : 'Enter your master password to unlock'}
            </p>

            {isRegistering && (
              <div className="bg-primary/10 border border-primary/30 p-3 mb-4 text-sm text-left">
                <p className="font-medium mb-2">First-time setup:</p>
                <ul className="text-xs space-y-1 text-gray-700">
                  <li>• Minimum 8 characters required</li>
                  <li>• This password is stored securely with blockchain encryption</li>
                  <li>• You'll use this password for all future vault access</li>
                </ul>
              </div>
            )}

            <input
              type="password"
              placeholder={isRegistering ? 'Create Master Password (min 8 chars)' : 'Master Password'}
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              className="w-full border outline-none focus:border-primary border-border bg-background px-4 py-3 mb-4"
              disabled={loading}
            />

            <button
              onClick={handleUnlock}
              disabled={loading || !masterPassword}
              className="w-full bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isRegistering ? 'Registering...' : 'Verifying...') : (isRegistering ? 'Register & Unlock' : 'Unlock Vault')}
            </button>

            {!isRegistering && (
              <p className="text-xs text-gray-600 mt-4">
                Your master password is protected by blockchain encryption
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vault unlocked view
  return (
    <div className="size-full p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter flex items-center gap-3">
            <Unlock className="text-green-500" size={32} />
            Password Vault
            {blockchainVerified && (
              <CheckCircle className="text-green-500" size={24} title="Blockchain Verified" />
            )}
          </h1>
          <p className="text-gray-600">{entries.length} passwords stored securely</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={1} />
            Add Password
          </button>
          <button
            onClick={handleLock}
            className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 flex items-center gap-2"
          >
            <Lock size={20} strokeWidth={1} />
            Lock
          </button>
        </div>
      </div>

      {/* Blockchain Status */}
      {blockchainVerified && (
        <div className="bg-green-500/10 border border-green-500 p-4 mb-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="text-green-500" size={24} />
            <div>
              <p className="font-medium text-green-500">Blockchain Verified</p>
              <p className="text-sm text-gray-400">Your vault integrity has been verified on the blockchain</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {entries.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <Asterisk className="mx-auto mb-4 text-gray-600" size={48} />
            <h3 className="text-xl font-light mb-2">No Passwords Saved</h3>
            <p className="text-gray-600 mb-4">Start by adding your first password</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-6 py-2 flex items-center gap-2 mx-auto"
            >
              <Plus size={20} strokeWidth={1} />
              Add Your First Password
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-card border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10">
                      <Asterisk className="text-primary" size={24} strokeWidth={1} />
                    </div>
                    <div>
                      <h3 className="text-lg font-light">{entry.site}</h3>
                      <p className="text-sm text-gray-600">{entry.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                    disabled={loading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type={visibleIds.includes(entry.id) ? 'text' : 'password'}
                    value={entry.password}
                    readOnly
                    className="flex-1 border outline-none border-border px-4 py-2 bg-background"
                  />
                  <button
                    onClick={() => toggleVisibility(entry.id)}
                    className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
                  >
                    {visibleIds.includes(entry.id) ? (
                      <EyeOff size={20} strokeWidth={1} />
                    ) : (
                      <Eye size={20} strokeWidth={1} />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(entry.password)}
                    className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
                  >
                    <Copy size={20} strokeWidth={1} />
                  </button>
                </div>

                {entry.notes && (
                  <p className="text-xs text-gray-600 mt-2">{entry.notes}</p>
                )}

                <p className="text-xs text-gray-700 mt-2">
                  Added: {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-card border border-border p-6 max-w-md w-full">
            <h2 className="text-2xl font-light mb-4">Add New Password</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Website/Service *</label>
                <input
                  type="text"
                  placeholder="e.g., Gmail, GitHub, Netflix"
                  value={newEntry.site}
                  onChange={(e) => setNewEntry({ ...newEntry, site: e.target.value })}
                  className="w-full border outline-none focus:border-primary border-border bg-background px-4 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Username/Email *</label>
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={newEntry.username}
                  onChange={(e) => setNewEntry({ ...newEntry, username: e.target.value })}
                  className="w-full border outline-none focus:border-primary border-border bg-background px-4 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newEntry.password}
                  onChange={(e) => setNewEntry({ ...newEntry, password: e.target.value })}
                  className="w-full border outline-none focus:border-primary border-border bg-background px-4 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Notes (optional)</label>
                <textarea
                  placeholder="Additional information..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full border outline-none focus:border-primary border-border bg-background px-4 py-2 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddEntry}
                disabled={loading}
                className="flex-1 bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewEntry({ site: '', username: '', password: '', notes: '' })
                }}
                disabled={loading}
                className="flex-1 bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
