import * as fs from "fs";
import { encrypt, decrypt } from "./crypto";

const VAULT_FILE = "./vault.json";

export interface VaultEntry {
  site: string;
  username: string;
  password: string;
}

export function saveVault(data: VaultEntry[], masterKey: string): void {
  const json = JSON.stringify(data);
  const encrypted = encrypt(json, masterKey);
  fs.writeFileSync(VAULT_FILE, encrypted, "utf8");
}

export function loadVault(masterKey: string): VaultEntry[] {
  if (!fs.existsSync(VAULT_FILE)) return [];
  const encrypted = fs.readFileSync(VAULT_FILE, "utf8");
  const decrypted = decrypt(encrypted, masterKey);
  return JSON.parse(decrypted) as VaultEntry[];
}
