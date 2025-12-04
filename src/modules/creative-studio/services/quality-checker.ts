/**
 * Quality Checker Service
 * Automatically scores and validates generated images
 */

import OpenAI from 'openai';
import { 
    QualityScores, 
    ComplianceRisk, 
    BrandMemory,
    ConfirmedCopy,
    AspectRatio,
} from '../types';

export interface QualityCheckResult {
    scores: QualityScores;
    issues: string[];
    passesQuality: boolean;
    needsRegeneration: boolean;
    suggestions: string[];
}

/**
 * Check image quality using vision model
 */
export async function checkImageQuality(
    imageUrl: string,
    brandMemory: BrandMemory,
    copy: ConfirmedCopy,
    aspectRatio: AspectRatio,
    apiKey: string
): Promise<QualityCheckResult> {
    const openai = new OpenAI({ apiKey });

    const prompt = buildQualityCheckPrompt(brandMemory, copy, aspectRatio);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert advertising creative quality analyst. 
You evaluate ad images against brand guidelines and best practices.
You must respond with ONLY valid JSON, no markdown or explanation.`,
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '{}';
        
        // Parse JSON response
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(cleanContent);

        return {
            scores: {
                brand_alignment: result.brand_alignment || 5,
                readability: result.readability || 5,
                platform_fit: result.platform_fit || 5,
                compliance_risk: mapComplianceRisk(result.compliance_risk),
            },
            issues: result.issues || [],
            passesQuality: checkPassesQuality(result),
            needsRegeneration: result.needs_regeneration || false,
            suggestions: result.suggestions || [],
        };
    } catch (error) {
        console.error('Quality check error:', error);
        // Return neutral scores on error
        return {
            scores: {
                brand_alignment: 5,
                readability: 5,
                platform_fit: 5,
                compliance_risk: 'low',
            },
            issues: ['Quality check could not be completed'],
            passesQuality: true,
            needsRegeneration: false,
            suggestions: [],
        };
    }
}

/**
 * Build the quality check prompt
 */
function buildQualityCheckPrompt(
    brandMemory: BrandMemory,
    copy: ConfirmedCopy,
    aspectRatio: AspectRatio
): string {
    const brandColors = brandMemory.primary_colors?.map(c => c.hex).join(', ') || 'not specified';
    
    return `
Analyze this advertising image and rate it on the following criteria.
Return your analysis as JSON with these exact fields:

CONTEXT:
- Brand: ${brandMemory.brand_name || 'Unknown'}
- Expected headline: "${copy.headline}"
- Expected CTA: "${copy.cta_text}"
- Brand colors: ${brandColors}
- Layout style: ${brandMemory.layout_style || 'modern'}
- Aspect ratio: ${aspectRatio}

RATE EACH 0-10:
1. brand_alignment: Does it match the brand colors, style, and feel?
2. readability: Is the headline text large, clear, and readable on mobile?
3. platform_fit: Is it optimized for the ${aspectRatio} format and mobile viewing?

COMPLIANCE CHECK:
- compliance_risk: "low" | "medium" | "high"
  - high: contains distorted faces, unreadable text, or compliance violations
  - medium: some issues but usable with minor concerns
  - low: clean and compliant

ISSUES TO CHECK:
- Is the headline "${copy.headline}" visible and readable?
- Are there distorted faces or hands?
- Is the image cluttered?
- Is text too small to read on mobile?
- Are colors aligned with brand (${brandColors})?
- Is there warped or stretched content?

Return JSON:
{
  "brand_alignment": number,
  "readability": number,
  "platform_fit": number,
  "compliance_risk": "low" | "medium" | "high",
  "issues": ["issue1", "issue2"],
  "needs_regeneration": boolean,
  "suggestions": ["suggestion1", "suggestion2"]
}
`.trim();
}

/**
 * Map string to ComplianceRisk type
 */
function mapComplianceRisk(risk: string): ComplianceRisk {
    if (risk === 'high') return 'high';
    if (risk === 'medium') return 'medium';
    return 'low';
}

/**
 * Check if image passes quality threshold
 */
function checkPassesQuality(result: {
    brand_alignment?: number;
    readability?: number;
    platform_fit?: number;
    compliance_risk?: string;
}): boolean {
    const brandAlignment = result.brand_alignment || 0;
    const readability = result.readability || 0;
    const platformFit = result.platform_fit || 0;
    const complianceRisk = result.compliance_risk || 'low';

    // Must score at least 6/10 on all metrics
    if (brandAlignment < 6) return false;
    if (readability < 6) return false;
    if (platformFit < 6) return false;
    
    // High compliance risk fails
    if (complianceRisk === 'high') return false;

    return true;
}

/**
 * Quick check for obvious issues without vision API
 * (Used as pre-filter before expensive API calls)
 */
export function quickValidation(imageUrl: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check URL is valid
    if (!imageUrl || !imageUrl.startsWith('http')) {
        issues.push('Invalid image URL');
    }

    return {
        valid: issues.length === 0,
        issues,
    };
}

/**
 * Calculate aggregate scores for a pack
 */
export function calculatePackScores(
    assetScores: Array<QualityScores>
): {
    avg_brand_alignment: number;
    avg_readability: number;
    avg_platform_fit: number;
    compliance_status: 'pending' | 'passed' | 'flagged';
} {
    if (assetScores.length === 0) {
        return {
            avg_brand_alignment: 0,
            avg_readability: 0,
            avg_platform_fit: 0,
            compliance_status: 'pending',
        };
    }

    const sum = assetScores.reduce(
        (acc, s) => ({
            brand_alignment: acc.brand_alignment + s.brand_alignment,
            readability: acc.readability + s.readability,
            platform_fit: acc.platform_fit + s.platform_fit,
        }),
        { brand_alignment: 0, readability: 0, platform_fit: 0 }
    );

    const count = assetScores.length;
    const hasHighRisk = assetScores.some(s => s.compliance_risk === 'high');
    const hasMediumRisk = assetScores.some(s => s.compliance_risk === 'medium');

    return {
        avg_brand_alignment: Math.round((sum.brand_alignment / count) * 10) / 10,
        avg_readability: Math.round((sum.readability / count) * 10) / 10,
        avg_platform_fit: Math.round((sum.platform_fit / count) * 10) / 10,
        compliance_status: hasHighRisk ? 'flagged' : hasMediumRisk ? 'flagged' : 'passed',
    };
}
