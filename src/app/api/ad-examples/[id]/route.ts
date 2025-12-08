import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ad-examples/[id] - Get a single ad example
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: example, error } = await supabase
      .from('ad_examples')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !example) {
      return NextResponse.json(
        { success: false, error: 'Example not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the org
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('org_id', example.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No access' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      example,
    });

  } catch (error) {
    console.error('Ad example GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ad-examples/[id] - Update an ad example
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get existing example
    const { data: existing } = await supabase
      .from('ad_examples')
      .select('org_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Example not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('org_id', existing.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.platform !== undefined) updates.platform = body.platform;
    if (body.mediaType !== undefined) updates.media_type = body.mediaType;
    if (body.adFormat !== undefined) updates.ad_format = body.adFormat;
    if (body.mediaUrl !== undefined) updates.media_url = body.mediaUrl;
    if (body.thumbnailUrl !== undefined) updates.thumbnail_url = body.thumbnailUrl;
    if (body.aspectRatio !== undefined) updates.aspect_ratio = body.aspectRatio;
    if (body.durationSeconds !== undefined) updates.duration_seconds = body.durationSeconds;
    if (body.headline !== undefined) updates.headline = body.headline;
    if (body.ctaText !== undefined) updates.cta_text = body.ctaText;
    if (body.performanceNotes !== undefined) updates.performance_notes = body.performanceNotes;
    if (body.performanceScore !== undefined) updates.performance_score = body.performanceScore;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.styleKeywords !== undefined) updates.style_keywords = body.styleKeywords;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.isFavorite !== undefined) updates.is_favorite = body.isFavorite;
    if (body.aiAnalysis !== undefined) updates.ai_analysis = body.aiAnalysis;

    const { data: example, error } = await supabase
      .from('ad_examples')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update ad example:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      example,
    });

  } catch (error) {
    console.error('Ad example PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ad-examples/[id] - Delete an ad example
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get existing example
    const { data: existing } = await supabase
      .from('ad_examples')
      .select('org_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Example not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('org_id', existing.org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No access' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('ad_examples')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete ad example:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Ad example DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
