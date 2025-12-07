import * as cheerio from 'cheerio';

const MAX_PARAGRAPH_CHARS = 1200;
const MAX_HEADINGS = 10;
const MAX_LOGOS = 10;
const MAX_COLORS = 6;

type JsonLdEntry = Record<string, any> | Array<Record<string, any>>;

export function normalizeUrl(url: string) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

export function toAbsolute(url: string | undefined, base: string) {
    if (!url) return '';
    try {
        return new URL(url, base).href;
    } catch {
        return url;
    }
}

export function parseJsonLd($: cheerio.CheerioAPI) {
    const scripts = $('script[type="application/ld+json"]');
    const result: { name?: string; description?: string; logo?: string; sameAs?: string[]; address?: string[] } = {};

    scripts.each((_, el) => {
        const raw = $(el).contents().text();
        try {
            const parsed: JsonLdEntry = JSON.parse(raw);
            const entries = Array.isArray(parsed) ? parsed : [parsed];

            for (const entry of entries) {
                const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
                if (!types) continue;
                if (types.includes('Organization') || types.includes('LocalBusiness') || types.includes('Corporation')) {
                    result.name = result.name || entry.name;
                    result.description = result.description || entry.description;
                    result.logo = result.logo || entry.logo || entry.image;
                    if (entry.sameAs && Array.isArray(entry.sameAs)) {
                        result.sameAs = Array.from(new Set([...(result.sameAs || []), ...entry.sameAs]));
                    }
                    const address = entry.address;
                    if (address) {
                        const addressLine = typeof address === 'string'
                            ? address
                            : [address.streetAddress, address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join(', ');
                        if (addressLine) {
                            result.address = Array.from(new Set([...(result.address || []), addressLine]));
                        }
                    }
                }
            }
        } catch {
            // ignore invalid blobs
        }
    });

    return result;
}

export function extractSocialLinks($: cheerio.CheerioAPI, baseUrl: string, sameAs?: string[]) {
    const links = $('a')
        .map((_, el) => $(el).attr('href') || '')
        .get()
        .filter(Boolean);

    const candidates = Array.from(new Set([...(sameAs || []), ...links])).map((link) => toAbsolute(link, baseUrl));
    const socials: Record<string, string> = {};
    const socialHosts = {
        twitter: ['twitter.com', 'x.com'],
        linkedin: ['linkedin.com'],
        instagram: ['instagram.com'],
        youtube: ['youtube.com', 'youtu.be'],
        tiktok: ['tiktok.com'],
        facebook: ['facebook.com', 'fb.com'],
    };

    for (const link of candidates) {
        try {
            const { host } = new URL(link);
            for (const [key, hosts] of Object.entries(socialHosts)) {
                if (hosts.some((h) => host.includes(h))) {
                    socials[key] = link;
                }
            }
        } catch {
            // ignore malformed
        }
    }

    return socials;
}

export function extractLogoCandidates($: cheerio.CheerioAPI, baseUrl: string, jsonLdLogo?: string) {
    const iconLinks = [
        $('link[rel="icon"]').attr('href'),
        $('link[rel="shortcut icon"]').attr('href'),
        $('link[rel="apple-touch-icon"]').attr('href'),
        $('meta[property="og:image"]').attr('content'),
        $('meta[name="twitter:image"]').attr('content'),
        jsonLdLogo,
    ].filter(Boolean) as string[];

    const headerLogos = $('header img').map((_, el) => {
        const src = $(el).attr('src');
        const alt = ($(el).attr('alt') || '').toLowerCase();
        const className = ($(el).attr('class') || '').toLowerCase();
        const id = ($(el).attr('id') || '').toLowerCase();
        if (src && (alt.includes('logo') || className.includes('logo') || id.includes('logo') || src.toLowerCase().includes('logo'))) {
            return toAbsolute(src, baseUrl);
        }
        return null;
    }).get().filter(Boolean);

    const footerLogos = $('footer img').map((_, el) => {
        const src = $(el).attr('src');
        const alt = ($(el).attr('alt') || '').toLowerCase();
        const className = ($(el).attr('class') || '').toLowerCase();
        const id = ($(el).attr('id') || '').toLowerCase();
        if (src && (alt.includes('logo') || className.includes('logo') || id.includes('logo') || src.toLowerCase().includes('logo'))) {
            return toAbsolute(src, baseUrl);
        }
        return null;
    }).get().filter(Boolean);

    const imgLogos = $('img').map((_, el) => {
        const src = $(el).attr('src');
        const alt = ($(el).attr('alt') || '').toLowerCase();
        const className = ($(el).attr('class') || '').toLowerCase();
        const id = ($(el).attr('id') || '').toLowerCase();

        if (src && (alt.includes('logo') || className.includes('logo') || id.includes('logo') || src.toLowerCase().includes('logo'))) {
            return toAbsolute(src, baseUrl);
        }
        return null;
    }).get().filter(Boolean);

    // Prioritize header > footer > explicit icon/meta tags > any other logo-like imgs
    const all = Array.from(new Set([
        ...headerLogos,
        ...footerLogos,
        ...iconLinks.map((l) => toAbsolute(l, baseUrl)),
        ...imgLogos,
    ])).slice(0, MAX_LOGOS);
    return all;
}

export function extractColors($: cheerio.CheerioAPI, themeColor?: string, extraCss?: string) {
    const styles = $('style').map((_, el) => $(el).html() || '').get().join('\n');
    const inline = $('[style]').map((_, el) => $(el).attr('style') || '').get().join('\n');
    const cssBundle = [styles, inline, extraCss || ''].join('\n');
    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;
    const matches = [...cssBundle.matchAll(hexRegex)].map((m) => m[0].toUpperCase());

    // Count frequency to prioritize dominant colors
    const freq = new Map<string, number>();
    matches.forEach((hex) => {
        freq.set(hex, (freq.get(hex) || 0) + 1);
    });

    const sorted = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex);

    const withTheme = themeColor ? [themeColor.toUpperCase(), ...sorted] : sorted;
    const uniques = Array.from(new Set(withTheme)).slice(0, MAX_COLORS);

    return uniques.map((value, idx) => ({
        name: idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : `Accent ${idx}`,
        value,
        type: idx === 0 ? 'primary' : idx === 1 ? 'secondary' : 'accent' as const,
    }));
}

export function extractHeadings($: cheerio.CheerioAPI) {
    return $('h1, h2, h3')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .slice(0, MAX_HEADINGS);
}

export function extractParagraphs($: cheerio.CheerioAPI) {
    const text = $('p').map((_, el) => $(el).text().trim()).get().filter(Boolean).join(' ');
    return text.substring(0, MAX_PARAGRAPH_CHARS);
}
