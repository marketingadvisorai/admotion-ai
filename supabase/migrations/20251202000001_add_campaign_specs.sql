
-- Add duration and aspect_ratio columns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;
