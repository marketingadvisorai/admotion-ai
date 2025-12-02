
-- Add new columns to campaigns table for the AI Agent workflow
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strategy JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'draft_chat';

-- Update the status check constraint if it exists, or add a new one if needed
-- For simplicity in this migration, we'll just ensure the column exists. 
-- In a real production env, we might want to update the enum type if 'status' is an enum.
-- Assuming 'status' is text based on previous file views, but let's check.
