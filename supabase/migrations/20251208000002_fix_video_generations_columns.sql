-- Migration: Add missing columns to video_generations table
-- Date: 2025-12-08
-- Description: Fixes "Could not find the 'aspect_ratio' column" error

-- Add missing columns to video_generations
ALTER TABLE video_generations 
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS duration integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS brand_kit_id uuid REFERENCES brand_kits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- Make campaign_id optional (can generate without campaign)
ALTER TABLE video_generations 
  ALTER COLUMN campaign_id DROP NOT NULL;

-- Add platform column for multi-platform support
ALTER TABLE video_generations
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'google_ads';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_generations_org_id ON video_generations(org_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_session_id ON video_generations(session_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_brand_kit_id ON video_generations(brand_kit_id);
