-- Run this SQL in Supabase Dashboard > SQL Editor
-- This adds the missing columns to image_generations table

-- Make campaign_id nullable (images can be generated without a campaign)
ALTER TABLE image_generations ALTER COLUMN campaign_id DROP NOT NULL;

-- Add missing columns
ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS brand_kit_id uuid REFERENCES brand_kits(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS style text,
ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_image_generations_brand_kit ON image_generations(brand_kit_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_model ON image_generations(model);

-- Add update policy for members
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'image_generations' 
        AND policyname = 'Members can update own image generations'
    ) THEN
        CREATE POLICY "Members can update own image generations"
            ON image_generations
            FOR UPDATE
            USING (org_id IN (SELECT get_user_org_ids()));
    END IF;
END $$;

-- Add delete policy for members  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'image_generations' 
        AND policyname = 'Members can delete own image generations'
    ) THEN
        CREATE POLICY "Members can delete own image generations"
            ON image_generations
            FOR DELETE
            USING (org_id IN (SELECT get_user_org_ids()));
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'image_generations'
ORDER BY ordinal_position;
