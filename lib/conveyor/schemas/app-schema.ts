import { z } from 'zod'

export const appIpcSchema = {
  version: {
    args: z.tuple([]),
    return: z.string(),
  },
  'run-vault-test': {
    args: z.tuple([]),
    return: z.object({
      entries: z.array(
        z.object({
          site: z.string(),
          username: z.string(),
          password: z.string(),
        })
      ),
      encrypted: z.string(),
    }),
  },
  'run-blockchain-test': {
    args: z.tuple([]),
    return: z.object({
      ledger: z.array(
        z.object({
          timestamp: z.number(),
          hash: z.string(),
        })
      ),
      latest: z.object({
        timestamp: z.number(),
        hash: z.string(),
      }).nullable(),
      verified: z.boolean(),
      encrypted: z.string(),
    }),
  },
}
