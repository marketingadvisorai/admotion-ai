import { createClient } from '@/lib/db/server';

export async function uploadFromUrl(url: string, path: string, bucket: string = 'generated-videos') {
    const supabase = await createClient();

    try {
        // 1. Fetch the file from the external URL
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        const blob = await response.blob();

        // 2. Upload to Supabase Storage
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(path, blob, {
                contentType: blob.type,
                upsert: true,
            });

        if (error) throw error;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.error('Storage upload error:', error);
        throw error;
    }
}
