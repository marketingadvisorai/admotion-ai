-- Add cost column to llm_usage_events
alter table llm_usage_events 
add column cost numeric default 0;
