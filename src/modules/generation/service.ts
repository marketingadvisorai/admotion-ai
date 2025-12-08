import { createClient } from '@/lib/db/server';
// GenerationStatus and VideoGenerationProvider available in ./types if needed
import { getProvider } from './providers/factory';
import { cache } from 'react';
import { uploadFromUrl } from '@/lib/storage';

export interface CreateGenerationInput {
    orgId: string;
    campaignId: string;
    providerId: string;
    prompt: string;
    aspectRatio: '16:9' | '9:16' | '1:1';
    duration: number;
}

export async function createGenerationJob(input: CreateGenerationInput) {
    const supabase = await createClient();
    const provider = getProvider(input.providerId);

    // 1. Create DB Record
    const { data: job, error } = await supabase
        .from('video_generations')
        .insert({
            org_id: input.orgId,
            campaign_id: input.campaignId,
            provider: input.providerId,
            prompt_used: input.prompt,
            status: 'queued',
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // 2. Call Provider
    try {
        const externalJobId = await provider.generateVideo({
            prompt: input.prompt,
            aspectRatio: input.aspectRatio,
            duration: input.duration,
        });

        // 3. Update DB with external ID
        await supabase
            .from('video_generations')
            .update({
                external_job_id: externalJobId,
                status: 'processing'
            })
            .eq('id', job.id);

        return { success: true, jobId: job.id };
    } catch (err) {
        // Mark as failed if provider call fails
        await supabase
            .from('video_generations')
            .update({
                status: 'failed',
                // error: err.message // TODO: Add error column to DB
            })
            .eq('id', job.id);
        throw err;
    }
}

export const getGenerations = cache(async (campaignId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
});

export async function checkJobStatus(jobId: string) {
    const supabase = await createClient();

    // Get job details
    const { data: job } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', jobId)
        .single();

    if (!job || !job.external_job_id || job.status === 'completed' || job.status === 'failed') {
        return;
    }

    try {
        const provider = getProvider(job.provider);
        const status = await provider.checkStatus(job.external_job_id);

        if (status.status === 'completed' && status.resultUrl) {
            try {
                // Upload to Supabase Storage to persist the asset
                const fileName = `${job.campaign_id}/${job.id}-${Date.now()}.mp4`;
                const storageUrl = await uploadFromUrl(status.resultUrl, fileName);

                await supabase
                    .from('video_generations')
                    .update({
                        status: 'completed',
                        result_url: storageUrl,
                        retry_count: 0, // Reset retry count on success
                    })
                    .eq('id', jobId);
            } catch (error) {
                console.error('Failed to upload result to storage:', error);
                // Fallback to provider URL if upload fails
                await supabase
                    .from('video_generations')
                    .update({
                        status: 'completed',
                        result_url: status.resultUrl,
                        retry_count: 0,
                    })
                    .eq('id', jobId);
            }
        } else if (status.status === 'failed') {
            // If the provider explicitly reports 'failed', it's a terminal failure.
            await supabase
                .from('video_generations')
                .update({ status: 'failed' })
                .eq('id', jobId);
        }
    } catch (error) {
        console.error(`Error checking job ${jobId}:`, error);
        // Transient error - increment retry count
        const MAX_RETRIES = 5;
        const currentRetries = job.retry_count || 0;

        if (currentRetries < MAX_RETRIES) {
            await supabase
                .from('video_generations')
                .update({
                    retry_count: currentRetries + 1
                })
                .eq('id', jobId);
        } else {
            await supabase
                .from('video_generations')
                .update({
                    status: 'failed',
                })
                .eq('id', jobId);
        }
    }
}
