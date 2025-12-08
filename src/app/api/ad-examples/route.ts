import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

/**
 * GET /api/ad-examples - List ad examples for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const platform = searchParams.get('platform');
    const mediaType = searchParams.get('mediaType');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Missing orgId' },
        { status: 400 }
      );
    }

    // Verify user has access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No access to organization' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('ad_examples')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }
    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    const { data: examples, error } = await query.limit(100);

    if (error) {
      console.error('Failed to fetch ad examples:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch examples' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      examples: examples || [],
    });

  } catch (error) {
    console.error('Ad examples API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ad-examples - Create a new ad example
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orgId,
      name,
      description,
      platform,
      mediaType,
      adFormat,
      mediaUrl,
      thumbnailUrl,
      aspectRatio,
      durationSeconds,
      headline,
      ctaText,
      performanceNotes,
      performanceScore,
      tags,
      styleKeywords,
    } = body;

    if (!orgId || !name || !platform || !mediaType || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No access to organization' },
        { status: 403 }
      );
    }

    // Insert ad example
    const { data: example, error } = await supabase
      .from('ad_examples')
      .insert({
        org_id: orgId,
        name,
        description,
        platform,
        media_type: mediaType,
        ad_format: adFormat,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        aspect_ratio: aspectRatio || '16:9',
        duration_seconds: mediaType === 'video' ? durationSeconds : null,
        headline,
        cta_text: ctaText,
        performance_notes: performanceNotes,
        performance_score: performanceScore,
        tags: tags || [],
        style_keywords: styleKeywords || [],
        is_active: true,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create ad example:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create example' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      example,
    });

  } catch (error) {
    console.error('Ad examples POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
