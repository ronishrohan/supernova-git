# Supabase Setup Guide for SentinelDesk

## Quick Start

### Step 1: Add Your Supabase Credentials

1. Open `lib/backend/supabase/supabase.ts`
2. Replace the placeholder values on lines 10-11 with your actual Supabase credentials:

```typescript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co' // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'your-anon-key-here' // Replace with your Supabase anon key
```

**Where to find these values:**
1. Go to https://app.supabase.com
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (paste as SUPABASE_URL)
   - **anon/public** key (paste as SUPABASE_ANON_KEY)

### Step 2: Create Database Tables

1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `lib/backend/supabase/schema.sql` in your code editor
4. Copy ALL the SQL code
5. Paste it into the SQL Editor in Supabase
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: `Success. No rows returned`

### Step 3: Verify Tables Created

1. Go to **Table Editor** in the Supabase dashboard (left sidebar)
2. You should see 4 tables:
   - ✅ `auth_data` - Master password storage
   - ✅ `vault_data` - Encrypted password vault
   - ✅ `scan_history` - Security scan results
   - ✅ `blockchain_data` - Blockchain proof ledger

### Step 4: Test Your App

1. Run the app: `npm run dev`
2. Go to the **Vault** page
3. Create a master password (first time only)
4. Add a password entry
5. Check your Supabase **Table Editor** → `vault_data` - you should see encrypted data!

## What's Stored Where

| Module | Supabase Table | What's Stored |
|--------|---------------|---------------|
| Authentication | `auth_data` | Master password (hashed with PBKDF2 + salt) |
| Vault | `vault_data` | Password entries (AES-256 encrypted) |
| Scanner | `scan_history` | Scan results (files, URLs, text) |
| Blockchain | `blockchain_data` | Blockchain proof-of-work ledger |

## Security Notes

- ✅ Master passwords are hashed with PBKDF2 (100,000 iterations)
- ✅ Vault data is encrypted with AES-256-GCM before storage
- ✅ Blockchain provides tamper-evident storage
- ✅ The anon key is safe to use in client-side code
- ✅ All sensitive data is encrypted client-side before reaching Supabase

## Troubleshooting

### Error: "relation does not exist"
**Fix:** You forgot to run the SQL schema. Go back to Step 2.

### Error: "Invalid API key"
**Fix:** Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabase.ts`. Make sure there are no extra quotes or spaces.

### Error: "Failed to fetch"
**Fix:**
- Check your internet connection
- Verify the Supabase project URL is correct
- Make sure your Supabase project is not paused (free tier projects pause after 1 week of inactivity)

### Master password not persisting
**Fix:** Make sure the `auth_data` table exists and RLS policies allow inserts.

### Vault data not saving
**Fix:** Check the browser console for errors. Verify the `vault_data` table exists.

## Data Migration from Local Storage

If you previously used local JSON storage (`lib/backend/data/`), the app will now use Supabase instead. Local data will NOT be automatically migrated. You can:

1. **Start fresh** (recommended): Just use the app normally with Supabase
2. **Manual migration**: Not recommended - easier to re-add entries manually

## Advanced: Customizing RLS Policies

By default, all tables have permissive RLS policies (`ALLOW ALL`). For production:

1. Go to **Authentication** → **Policies** in Supabase
2. Customize policies per table
3. Example: Restrict vault access to authenticated users only

## Need Help?

- Check the console logs for detailed error messages
- Verify all 4 tables exist in Table Editor
- Make sure you're using the correct project URL (ends with `.supabase.co`)
- Test the SQL schema line-by-line if bulk insert fails

## What Changed from Local Storage?

| Before (Local JSON) | After (Supabase) |
|---------------------|------------------|
| `lib/backend/data/auth.json` | `auth_data` table |
| `lib/backend/data/vault.json` | `vault_data` table |
| `lib/backend/data/scan-history.json` | `scan_history` table |
| `lib/backend/data/mockchain.json` | `blockchain_data` table |

All modules now use Supabase automatically - no code changes needed on your part!
