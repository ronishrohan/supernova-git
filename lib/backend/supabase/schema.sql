-- Supabase Database Schema for SentinelDesk
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Auth Data Table
CREATE TABLE IF NOT EXISTS auth_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  blockchain_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault Data Table
CREATE TABLE IF NOT EXISTS vault_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  blockchain_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan History Table
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  target TEXT NOT NULL,
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  reasons JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain Data Table
CREATE TABLE IF NOT EXISTS blockchain_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_data_user_id ON auth_data(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_data_user_id ON vault_data(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_data_user_id ON blockchain_data(user_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE auth_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_data ENABLE ROW LEVEL SECURITY;

-- Create policies (allows all operations for now - customize based on your auth)
CREATE POLICY "Allow all operations" ON auth_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON scan_history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON blockchain_data FOR ALL USING (true);
