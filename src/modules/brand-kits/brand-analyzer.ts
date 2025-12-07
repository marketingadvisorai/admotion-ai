import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import {
    extractColors,
    extractHeadings,
    extractLogoCandidates,
    extractParagraphs,
    extractSocialLinks,
    toAbsolute,
    normalizeUrl,
    parseJsonLd,
} from './scraper';
import { getLlmProfile } from '@/modules/llm/service';
import { recordLlmUsage } from '@/modules/llm/usage';

export interface BrandIdentity {
    business_name: string;
    description: string;
    logo_url?: string;
    logo_candidates?: string[];
    colors: Array<{ name: string; value: string; type: 'primary' | 'secondary' | 'accent' }>;
    fonts: { heading: string; body: string };
    social_links: { [key: string]: string };
    locations: string[];
    offerings: Array<{ name: string; description: string }>;
    strategy: {
        vision: string;
        mission: string;
        values: string[];
        target_audience: string;
        brand_voice: string;
        key_differentiators: string[];
        quick_actions?: string[];
        // Deep Marketing Insights
        industry?: string;
        marketing_angles?: string[];
        pain_points?: string[];
        key_benefits?: string[];
        customer_demographics?: string;
        content_ideas?: string[];
    };
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost: number;
    };
}

const SYSTEM_PROMPT = `You are a Senior Marketing Strategist & Brand Expert.
You get a compact JSON snapshot (already scraped) for a company. Your goal is to extract not just the visual identity, but the *marketing soul* of the business to enable high-conversion video ad generation.

Return valid JSON with this shape:
{
  "business_name": "Name",
  "description": "1-2 sentences (<=40 words).",
  "logo_url": "Best logo URL from provided candidates or empty.",
  "colors": [ { "name": "Primary", "value": "#0B5FFF", "type": "primary" } ],
  "fonts": { "heading": "Inter", "body": "Inter" },
  "social_links": { "twitter": "...", "linkedin": "...", "instagram": "...", "youtube": "...", "tiktok": "..." },
  "locations": ["City, State/Country"],
  "offerings": [ { "name": "Product/Service", "description": "Short phrase" } ],
  "strategy": {
    "vision": "Short phrase",
    "mission": "Short phrase",
    "values": ["value1", "value2"],
    "target_audience": "Who they serve (consider location + category)",
    "brand_voice": "Tone (e.g., Friendly, Premium, Playful)",
    "key_differentiators": ["1", "2"],
    "quick_actions": ["3 punchy marketing plays tailored to location/category/audience"],
    
    "industry": "Specific Niche (e.g., 'SaaS > Email Marketing' or 'Local Service > HVAC')",
    "marketing_angles": [
        "Hook 1: Stop wasting time on...",
        "Hook 2: The secret to...",
        "Hook 3: Get X without Y..."
    ],
    "pain_points": [
        "Problem 1 they solve",
        "Problem 2 they solve"
    ],
    "key_benefits": [
        "Tangible result 1",
        "Tangible result 2"
    ],
    "customer_demographics": "Detailed persona (e.g., 'Busy moms aged 30-45 in suburban areas who value convenience')",
    "content_ideas": [
        "Video Idea 1: Showcasing the process of...",
        "Video Idea 2: Customer testimonial about...",
        "Video Idea 3: 'Did you know?' educational clip about..."
    ]
  }
}

Rules:
- Think like a marketer: Focus on *conversion*, *hooks*, and *benefits*.
- Prefer exact scraped fields (schema.org, meta, open graph, sameAs) before guessing.
- Choose the best logo candidate; leave empty if none are credible.
- Colors: pick up to 3 distinct hex codes; map first to primary, second to secondary, rest to accent.
- Keep every text field succinct; no fluff.`;

export class BrandAnalyzer {
    static async analyze(rawUrl: string, apiKey?: string, orgId?: string, modelOverride?: string): Promise<BrandIdentity> {
        const url = normalizeUrl(rawUrl);
        const key = apiKey || process.env.OPENAI_API_KEY;

        if (!key) {
            throw new Error('OpenAI API Key is not configured. Please add it in Settings > Integrations.');
        }

        const openai = new OpenAI({
            apiKey: key,
        });

        try {
            // 1. Fetch HTML
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();

            // 2. Parse HTML with Cheerio
            const $ = cheerio.load(html);
            const baseUrl = new URL(url).origin;

            // 3. Extract structured signals first (cheap)
            const jsonLd = parseJsonLd($);
            const title = jsonLd.name || $('title').text() || '';
            const metaDescription = jsonLd.description || $('meta[name="description"]').attr('content') || '';
            const themeColor = $('meta[name="theme-color"]').attr('content') || '';
            const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';

            const socialLinks = extractSocialLinks($, baseUrl, jsonLd.sameAs);
            const logoCandidates = extractLogoCandidates($, baseUrl, jsonLd.logo);
            // Pull a small sample of external CSS to improve color detection
            let externalCss = '';
            try {
                const stylesheetHrefs = $('link[rel="stylesheet"], link[rel="preload"][as="style"]')
                    .map((_, el) => $(el).attr('href'))
                    .get()
                    .filter(Boolean)
                    .slice(0, 3) as string[];

                const cssResponses = await Promise.all(
                    stylesheetHrefs.map(async (href) => {
                        try {
                            const cssUrl = toAbsolute(href, baseUrl);
                            const res = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                            if (res.ok) return await res.text();
                        } catch {
                            return '';
                        }
                        return '';
                    })
                );
                externalCss = cssResponses.filter(Boolean).join('\n');
            } catch {
                externalCss = '';
            }

            const colorPalette = extractColors($, themeColor, externalCss);
            const headings = extractHeadings($);
            const paragraphs = extractParagraphs($);

            // Build minimal payload for OpenAI
            const compactSnapshot = {
                url,
                meta: { title, description: metaDescription, themeColor, ogSiteName },
                schema_org: jsonLd,
                social_links: socialLinks,
                logo_candidates: logoCandidates,
                color_candidates: colorPalette.map((c) => c.value),
                headings,
                summary_text: paragraphs,
            };

            // 4. Resolve LLM profile if configured (super admin can override model/prompt)
            const profile = await getLlmProfile('brand_analyzer');
            const systemPrompt = profile?.system_prompt || SYSTEM_PROMPT;
            const model = modelOverride || profile?.model || 'gpt-4o';
            const temperature = profile?.temperature ?? 0.2;
            const maxTokens = profile?.max_tokens ?? 700;

            // 5. Send to OpenAI with tight, structured prompt
            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Use this pre-scraped JSON to infer the brand. Do not repeat the input. ${JSON.stringify(compactSnapshot)}` }
                ],
                response_format: { type: "json_object" },
                max_tokens: maxTokens,
                temperature,
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');

            const rawColors = Array.isArray(result.colors) ? result.colors : [];
            const validHex = (value: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
            const sanitizedColors = rawColors
                .filter((c: any) => c && typeof c.value === 'string' && validHex(c.value))
                .map((c: any, idx: number) => ({
                    name: c.name || (idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : `Accent ${idx}`),
                    value: c.value.trim(),
                    type: c.type === 'primary' || c.type === 'secondary' || c.type === 'accent'
                        ? c.type
                        : (idx === 0 ? 'primary' : idx === 1 ? 'secondary' : 'accent'),
                }));

            // 6. Record usage if we know the org
            let usageCost = 0;
            if (orgId && completion.usage) {
                const usageResult = await recordLlmUsage({
                    orgId,
                    provider: 'openai',
                    model,
                    kind: 'brand_analysis',
                    inputTokens: completion.usage.prompt_tokens ?? 0,
                    outputTokens: completion.usage.completion_tokens ?? 0,
                    totalTokens: completion.usage.total_tokens ?? 0,
                });
                usageCost = usageResult?.cost || 0;
            }

            // 7. Validate and return
            return {
                business_name: result.business_name || title || 'Unknown Business',
                description: result.description || metaDescription || '',
                logo_url: result.logo_url || logoCandidates[0] || '',
                logo_candidates: Array.isArray(result.logo_candidates) && result.logo_candidates.length
                    ? result.logo_candidates
                    : logoCandidates,
                colors: sanitizedColors.length ? sanitizedColors : colorPalette,
                fonts: result.fonts || { heading: 'Inter', body: 'Inter' },
                social_links: result.social_links || socialLinks,
                locations: result.locations || jsonLd.address || [],
                offerings: result.offerings || [],
                strategy: result.strategy || {
                    vision: '',
                    mission: '',
                    values: [],
                    target_audience: '',
                    brand_voice: '',
                    key_differentiators: [],
                    quick_actions: [],
                },
                usage: completion.usage ? {
                    inputTokens: completion.usage.prompt_tokens || 0,
                    outputTokens: completion.usage.completion_tokens || 0,
                    totalTokens: completion.usage.total_tokens || 0,
                    cost: usageCost
                } : undefined
            };

        } catch (error: any) {
            console.error('Brand analysis failed:', error);

            if (error instanceof Error && error.message) {
                throw error;
            }

            throw new Error('Failed to analyze brand. Please check the URL and try again.');
        }
    }
}
