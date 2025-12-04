/**
 * Normalizes a URL string to ensure it has a protocol.
 * If the URL is missing a protocol, 'https://' is prepended.
 * @param url The URL string to normalize
 * @returns The normalized URL string
 */
export function normalizeUrl(url: string): string {
    if (!url) return '';

    // Remove leading/trailing whitespace
    const trimmedUrl = url.trim();

    // Check if it already starts with http:// or https://
    if (/^https?:\/\//i.test(trimmedUrl)) {
        return trimmedUrl;
    }

    // Prepend https://
    return `https://${trimmedUrl}`;
}

/**
 * Validates if a string is a valid URL (loose validation to allow domain.com)
 * @param url The URL string to validate
 * @returns boolean
 */
export function isValidUrl(url: string): boolean {
    try {
        const normalized = normalizeUrl(url);
        new URL(normalized);
        return true;
    } catch {
        return false;
    }
}
