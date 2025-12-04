import { createClient } from '@/lib/db/server';

/**
 * Upload a file from an external URL to Supabase Storage
 */
export async function uploadFromUrl(url: string, path: string, bucket: string = 'generated-videos') {
    const supabase = await createClient();

    try {
        // 1. Fetch the file from the external URL
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        const blob = await response.blob();

        // 2. Upload to Supabase Storage
        const { error } = await supabase
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

/**
 * Upload a base64 encoded file to Supabase Storage
 */
export async function uploadBase64(
    base64Data: string, 
    path: string, 
    mimeType: string = 'image/png',
    bucket: string = 'generated-images'
) {
    const supabase = await createClient();

    try {
        // 1. Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Upload to Supabase Storage
        const { error } = await supabase
            .storage
            .from(bucket)
            .upload(path, bytes, {
                contentType: mimeType,
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
        console.error('Storage upload error (base64):', error);
        throw error;
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string, bucket: string = 'generated-images') {
    const supabase = await createClient();
    
    const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path]);

    if (error) throw error;
    return true;
}
