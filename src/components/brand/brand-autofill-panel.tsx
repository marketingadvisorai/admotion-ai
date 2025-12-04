'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AutofillResult {
    business_name?: string;
    logo_url?: string;
    colors?: Array<{ value: string; type?: string }>;
    fonts?: { heading?: string; body?: string };
    description?: string;
    strategy?: { quick_actions?: string[] };
    locations?: string[];
}

interface Props {
    websiteUrl: string;
    onWebsiteUrlChange: (value: string) => void;
    onApply: (data: AutofillResult) => void;
}

export default function BrandAutofillPanel({ websiteUrl, onWebsiteUrlChange, onApply }: Props) {
    const [analyzeLoading, setAnalyzeLoading] = useState(false);
    const [analyzeError, setAnalyzeError] = useState('');
    const [quickActions, setQuickActions] = useState<string[]>([]);

    const handleAnalyze = async () => {
        if (!websiteUrl) {
            setAnalyzeError('Enter a website URL first.');
            return;
        }
        setAnalyzeError('');
        setAnalyzeLoading(true);

        try {
            const res = await fetch('/api/brand/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl }),
            });

            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || 'Analysis failed');
            }

            const data: AutofillResult = json.data || {};
            onApply(data);
            setQuickActions(data.strategy?.quick_actions || []);
        } catch (error: any) {
            setAnalyzeError(error.message || 'Failed to analyze website');
        } finally {
            setAnalyzeLoading(false);
        }
    };

    return (
        <div className="space-y-3 rounded-md border border-gray-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                        id="websiteUrl"
                        name="websiteUrl"
                        placeholder="https://example.com"
                        value={websiteUrl}
                        onChange={(e) => onWebsiteUrlChange(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Paste a site to auto-fill name, logo, colors, and fonts.</p>
                </div>
                <Button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzeLoading}
                    className="sm:w-40"
                >
                    {analyzeLoading ? 'Analyzing...' : 'Autofill from URL'}
                </Button>
            </div>
            {analyzeError && (
                <p className="text-sm text-red-500">{analyzeError}</p>
            )}
            {quickActions.length ? (
                <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">Ideas</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                        {quickActions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
