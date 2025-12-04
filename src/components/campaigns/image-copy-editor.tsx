'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    campaignId: string;
    prompt: string;
    onPromptChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function ImageCopyEditor({ campaignId, prompt, onPromptChange, className, placeholder }: Props) {
    const [headline, setHeadline] = useState('');
    const [body, setBody] = useState('');
    const [cta, setCta] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#111827');
    const [secondaryColor, setSecondaryColor] = useState('#F3F4F6');
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [suggestError, setSuggestError] = useState('');

    const handleSuggest = async () => {
        setSuggestError('');
        setSuggestLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/image-prompt`);
            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || 'Failed to build prompt from strategy.');
            }

            const copy = json.copy || {};
            const layout = json.layout || {};

            setHeadline(copy.headline || '');
            setBody(copy.body || '');
            setCta(copy.cta || '');
            if (layout.primaryColor) setPrimaryColor(layout.primaryColor);
            if (layout.secondaryColor) setSecondaryColor(layout.secondaryColor);

            if (json.prompt) {
                onPromptChange(json.prompt);
            }
        } catch (error: any) {
            setSuggestError(error.message || 'Could not generate suggestion from campaign data.');
        } finally {
            setSuggestLoading(false);
        }
    };

    const applyCopyToPrompt = () => {
        const base =
            'High-conversion advertising image based on your brand kit and campaign strategy. Avoid heavy text walls; focus on visual storytelling.';
        const next = `${base} Headline text: "${headline}". Supporting copy: "${body}". Call-to-action button label: "${cta}".`;
        onPromptChange(next);
    };

    return (
        <>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Copy</Label>
                <div className="col-span-3 space-y-3">
                    <Input
                        placeholder="Headline"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                    />
                    <Input
                        placeholder="Supporting line"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                    <Input
                        placeholder="CTA label"
                        value={cta}
                        onChange={(e) => setCta(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSuggest}
                            disabled={suggestLoading}
                            className="px-0 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                            {suggestLoading ? 'Using strategy…' : 'Suggest from strategy & brand kit'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={applyCopyToPrompt}
                            className="px-0 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                        >
                            Use copy to update prompt
                        </Button>
                    </div>
                    {suggestError && (
                        <p className="text-xs text-red-500">{suggestError}</p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Preview</Label>
                <div className="col-span-3">
                    <div className="relative aspect-[4/5] rounded-lg border bg-gray-50 overflow-hidden">
                        <div className="absolute inset-0 flex flex-col justify-between p-3">
                            <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span className="px-2 py-1 rounded-full border bg-white/80">Logo</span>
                                <span className="px-2 py-1 rounded-full border bg-white/80">Tag</span>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-gray-900 line-clamp-2">
                                    {headline || 'Your main hook appears here'}
                                </div>
                                <div className="text-[11px] text-gray-600 line-clamp-3">
                                    {body || 'Short supporting line about the key benefit.'}
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <button
                                    type="button"
                                    className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {cta || 'Learn more'}
                                </button>
                            </div>
                        </div>
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                        This is a rough layout preview only. The final AI image will follow your prompt and brand
                        style but may differ visually.
                    </p>
                </div>
            </div>
        </>
    );
}

