-- Add retry_count column to video_generations table
ALTER TABLE video_generations 
ADD COLUMN retry_count INTEGER DEFAULT 0;
