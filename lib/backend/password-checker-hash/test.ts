import { saveVault, loadVault, VaultEntry } from "./vault";
import { encrypt } from "./crypto";

/**
 * Run a small vault save/load test and return the loaded vault.
 * This is exported so Electron (main process) can call it via IPC.
 */
export const runVaultTest = (masterKey = "testkey") => {
  // add some data
  const sampleVault: VaultEntry[] = [
    { site: "example.com", username: "user", password: "pass123" },
  ];

  // Save encrypted vault to disk
  saveVault(sampleVault, masterKey);

  // Also produce the encrypted string so we can return it to the caller
  const json = JSON.stringify(sampleVault);
  const encrypted = encrypt(json, masterKey);

  const loaded = loadVault(masterKey);

  return {
    entries: loaded,
    encrypted,
  } as {
    entries: VaultEntry[]
    encrypted: string
  }
}

// For direct node invocation (optional), keep backward-compatible behavior when run directly
if (require && require.main === module) {
  const result = runVaultTest();
  // eslint-disable-next-line no-console
  console.log("🔓 Loaded vault:", result);
}
