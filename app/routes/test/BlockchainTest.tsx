import React, { useState } from 'react'

export default function BlockchainTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const res = await (window as any).conveyor.app.runBlockchainTest()
      setResult(res)
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Blockchain mock test</h2>
      <p>Store a hash of the vault and verify it against the mock ledger.</p>
      <button onClick={runTest} disabled={loading}>{loading ? 'Running...' : 'Run blockchain test'}</button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <h3>Ledger</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.ledger ?? [], null, 2)}</pre>

          <h3 style={{ marginTop: 12 }}>Latest</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.latest ?? null, null, 2)}</pre>

          <h3 style={{ marginTop: 12 }}>Verified</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ verified: !!result.verified }, null, 2)}</pre>

          <h3 style={{ marginTop: 12 }}>Hashed (encrypted) value</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ hashed: result.encrypted ?? null }, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
