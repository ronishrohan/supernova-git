import * as fs from "fs";

const ledgerFile = "mockchain.json";

// store a hash “as if” it’s on blockchain
export function storeVaultProof(vaultData: string) {
  const hash = simpleHash(vaultData);
  const record = { timestamp: Date.now(), hash };

  let ledger: any[] = [];
  if (fs.existsSync(ledgerFile)) {
    ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf-8"));
  }

  ledger.push(record);
  fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));

  console.log("✅ Mock transaction stored locally!");
  console.log("🧾 Hash:", hash);
}

// verify latest hash
export function verifyVaultProof(vaultData: string) {
  if (!fs.existsSync(ledgerFile)) return false;

  const ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf-8"));
  const latest = ledger[ledger.length - 1];
  const currentHash = simpleHash(vaultData);

  if (latest.hash === currentHash) {
    console.log("✅ Vault integrity verified!");
    return true;
  } else {
    console.log("⚠️ Vault modified or tampered!");
    return false;
  }
}

// simple deterministic hash for demo (not cryptographically secure)
function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "0x" + (hash >>> 0).toString(16);
}

// Run a blockchain test: create a sample vault (via existing test runner), store a proof, and return ledger info
import { runVaultTest } from "./test"

export function runBlockchainTest(masterKey = "testkey") {
  // Ensure the vault exists and get the encrypted string
  const vaultResult = runVaultTest(masterKey) as { entries: any[]; encrypted: string }
  const encrypted = vaultResult.encrypted

  // store the encrypted string's hash as a mock transaction
  storeVaultProof(encrypted)

  // read current ledger
  let ledger: any[] = []
  if (fs.existsSync(ledgerFile)) {
    ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf-8"))
  }

  const latest = ledger[ledger.length - 1] ?? null
  const verified = verifyVaultProof(encrypted)

  return {
    ledger,
    latest,
    verified,
    encrypted,
  }
}
