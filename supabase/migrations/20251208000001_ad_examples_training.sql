-- ============================================
-- Ad Examples/Training System
-- Stores reference ads for AI training and guidance
-- ============================================

-- Ad examples table for storing reference ads
CREATE TABLE IF NOT EXISTS ad_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Platform and type
    platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'other')),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    ad_format TEXT, -- e.g., 'feed', 'stories', 'reels', 'in-stream', 'bumper'
    
    -- Media reference
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Creative details
    aspect_ratio TEXT DEFAULT '16:9',
    duration_seconds INTEGER, -- for videos
    headline TEXT,
    cta_text TEXT,
    
    -- Performance and learning
    performance_notes TEXT, -- What made this ad successful/unsuccessful
    performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 10), -- 1-10 rating
    tags TEXT[] DEFAULT '{}',
    style_keywords TEXT[] DEFAULT '{}', -- e.g., ['minimalist', 'bold', 'animated']
    
    -- AI analysis (populated by AI when uploaded)
    ai_analysis JSONB DEFAULT '{}', -- Visual analysis, detected elements, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_ad_examples_org_id ON ad_examples(org_id);
CREATE INDEX idx_ad_examples_platform ON ad_examples(platform);
CREATE INDEX idx_ad_examples_media_type ON ad_examples(media_type);
CREATE INDEX idx_ad_examples_is_active ON ad_examples(is_active);
CREATE INDEX idx_ad_examples_tags ON ad_examples USING GIN(tags);

-- Enable RLS
ALTER TABLE ad_examples ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view ad examples in their org"
    ON ad_examples FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ad examples in their org"
    ON ad_examples FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ad examples in their org"
    ON ad_examples FOR UPDATE
    USING (
        org_id IN (
            SELECT org_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ad examples in their org"
    ON ad_examples FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM organization_memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Update trigger
CREATE TRIGGER update_ad_examples_updated_at
    BEFORE UPDATE ON ad_examples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Platform presets for ad generation
-- ============================================

CREATE TABLE IF NOT EXISTS ad_platform_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Platform info
    platform TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    
    -- Video specs
    recommended_aspect_ratios TEXT[] DEFAULT '{}',
    max_duration_seconds INTEGER,
    min_duration_seconds INTEGER,
    recommended_duration_seconds INTEGER,
    
    -- Image specs
    image_sizes JSONB DEFAULT '[]', -- [{width, height, name}]
    
    -- Best practices
    best_practices JSONB DEFAULT '{}',
    -- {
    --   "hook_time": "5 seconds",
    --   "sound_default": "off",
    --   "caption_required": true,
    --   "cta_placement": "end",
    --   ...
    -- }
    
    -- Creative guidelines
    creative_guidelines TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert platform presets
INSERT INTO ad_platform_presets (platform, display_name, recommended_aspect_ratios, max_duration_seconds, min_duration_seconds, recommended_duration_seconds, best_practices, creative_guidelines) VALUES
(
    'google_ads',
    'Google Ads (YouTube)',
    ARRAY['16:9', '9:16', '1:1'],
    60,
    6,
    15,
    '{"hook_time": "5 seconds", "sound_default": "on", "skip_button_at": "5 seconds", "caption_required": false, "cta_placement": "end", "key_message_timing": "first 5 seconds"}',
    'Hook viewers in the first 5 seconds before skip button appears. Lead with your value proposition. Use clear branding throughout. End with strong CTA overlay.'
),
(
    'facebook',
    'Facebook Ads',
    ARRAY['1:1', '4:5', '16:9'],
    240,
    1,
    15,
    '{"hook_time": "3 seconds", "sound_default": "off", "caption_required": true, "cta_placement": "throughout", "optimal_length": "15-30 seconds", "text_overlay_limit": "20%"}',
    'Design for sound-off viewing with captions. Square (1:1) or vertical (4:5) performs best on mobile. Grab attention in first 3 seconds. Keep text minimal in video thumbnail.'
),
(
    'instagram',
    'Instagram (Feed/Stories/Reels)',
    ARRAY['9:16', '1:1', '4:5'],
    60,
    1,
    15,
    '{"hook_time": "2 seconds", "sound_default": "off_feed_on_reels", "caption_required": true, "cta_placement": "end", "native_feel": true}',
    'Reels: 9:16 vertical, native feel, trending audio. Feed: 1:1 or 4:5, sound-off design. Stories: 9:16, use interactive elements. Keep it authentic and visually striking.'
),
(
    'tiktok',
    'TikTok Ads',
    ARRAY['9:16'],
    60,
    5,
    15,
    '{"hook_time": "1-2 seconds", "sound_default": "on", "native_feel": true, "trending_aware": true, "caption_style": "native"}',
    'Make it feel native to TikTok. Hook immediately. Use trending sounds/styles. Authentic > polished. Fast-paced edits. Strong CTA at end.'
),
(
    'linkedin',
    'LinkedIn Ads',
    ARRAY['16:9', '1:1', '9:16'],
    600,
    3,
    30,
    '{"hook_time": "3 seconds", "sound_default": "off", "caption_required": true, "professional_tone": true}',
    'Professional tone. Educational or thought-leadership content performs well. Captions essential. Clear value proposition for B2B audience.'
)
ON CONFLICT (platform) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    recommended_aspect_ratios = EXCLUDED.recommended_aspect_ratios,
    max_duration_seconds = EXCLUDED.max_duration_seconds,
    min_duration_seconds = EXCLUDED.min_duration_seconds,
    recommended_duration_seconds = EXCLUDED.recommended_duration_seconds,
    best_practices = EXCLUDED.best_practices,
    creative_guidelines = EXCLUDED.creative_guidelines;

-- Create storage bucket for ad examples if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-examples', 'ad-examples', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ad-examples bucket
CREATE POLICY "Users can view ad examples files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ad-examples');

CREATE POLICY "Authenticated users can upload ad examples"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ad-examples' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their ad examples"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'ad-examples' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their ad examples"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'ad-examples' AND auth.role() = 'authenticated');
