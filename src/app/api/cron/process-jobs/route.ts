import { createClient } from '@/lib/db/server';
import { checkJobStatus } from '@/modules/generation/service';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // Fetch all processing jobs
    const { data: jobs, error } = await supabase
        .from('video_generations')
        .select('id')
        .eq('status', 'processing')
        .limit(10); // Process in batches

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = await Promise.allSettled(
        jobs.map(job => checkJobStatus(job.id))
    );

    return NextResponse.json({
        processed: jobs.length,
        results: results.map(r => r.status),
    });
}
