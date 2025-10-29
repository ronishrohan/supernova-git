import React, { useState } from 'react'

export default function TestRoute() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      // Use the exposed conveyor API from preload
      // Use any to avoid TS issues in the renderer
  const res = await (window as any).conveyor.app.runVaultTest()
  // normalize result to expected shape { entries, encrypted }
  setResult(res)
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Vault test</h2>
      <p>Click to run the vault save/load test via Electron main process.</p>
      <button onClick={runTest} disabled={loading}>{loading ? 'Running...' : 'Run vault test'}</button>
      {result && (
        <div style={{ marginTop: 12 }}>
          <h3>Decrypted entries</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.entries ?? result, null, 2)}</pre>

          <h3 style={{ marginTop: 12 }}>Hashed (encrypted) value</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ hashed: result.encrypted ?? null }, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
