import * as crypto from "crypto";

const algorithm = "aes-256-cbc";

export function encrypt(text: string, masterKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(masterKey).digest();
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encText: string, masterKey: string): string {
  const [ivHex, encrypted] = encText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(masterKey).digest();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
