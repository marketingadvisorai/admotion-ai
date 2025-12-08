-- Fix image_generations table - add missing columns
-- Dec 8, 2025

-- Make campaign_id nullable (images can be generated without a campaign)
ALTER TABLE image_generations ALTER COLUMN campaign_id DROP NOT NULL;

-- Add missing columns
ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS brand_kit_id uuid REFERENCES brand_kits(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS style text,
ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create index for brand_kit_id
CREATE INDEX IF NOT EXISTS idx_image_generations_brand_kit ON image_generations(brand_kit_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_model ON image_generations(model);

-- Add update policy for members
CREATE POLICY IF NOT EXISTS "Members can update own image generations"
  ON image_generations
  FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids()));

-- Add delete policy for members  
CREATE POLICY IF NOT EXISTS "Members can delete own image generations"
  ON image_generations
  FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids()));
