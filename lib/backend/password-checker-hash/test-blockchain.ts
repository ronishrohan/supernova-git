import { storeVaultProof, verifyVaultProof } from "./blockchain";

(async () => {
  const vaultData = "user: test, pass: 1234";

  await storeVaultProof(vaultData);
  verifyVaultProof(vaultData);
})();
