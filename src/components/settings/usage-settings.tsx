'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface UsageEvent {
    id: string;
    provider: string;
    model: string;
    kind: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    unit_count: number;
    created_at: string;
}

interface AggregatedUsage {
    provider: string;
    model: string;
    kind: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export function UsageSettings({ orgId }: { orgId: string }) {
    const [rows, setRows] = useState<AggregatedUsage[]>([]);
    const [totals, setTotals] = useState({
        tokens: 0,
        textTokens: 0,
        imageCalls: 0,
    });

    useEffect(() => {
        const supabase = createClient();

        const fetchUsage = async () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const { data } = await supabase
                .from('llm_usage_events')
                .select('*')
                .eq('org_id', orgId)
                .gte('created_at', start.toISOString())
                .order('created_at', { ascending: false });

            const events = (data as UsageEvent[]) || [];

            const map = new Map<string, AggregatedUsage>();
            let totalTokens = 0;
            let textTokens = 0;
            let imageCalls = 0;

            for (const e of events) {
                const key = `${e.provider}:${e.model}:${e.kind}`;
                const existing = map.get(key) || {
                    provider: e.provider,
                    model: e.model,
                    kind: e.kind,
                    calls: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                };

                existing.calls += e.unit_count || 1;
                existing.inputTokens += e.input_tokens || 0;
                existing.outputTokens += e.output_tokens || 0;
                existing.totalTokens += e.total_tokens || 0;

                map.set(key, existing);

                totalTokens += e.total_tokens || 0;
                if (e.kind === 'chat' || e.kind === 'strategy' || e.kind === 'brand_analysis') {
                    textTokens += e.total_tokens || 0;
                }
                if (e.kind === 'image') {
                    imageCalls += e.unit_count || 1;
                }
            }

            setRows(Array.from(map.values()));
            setTotals({ tokens: totalTokens, textTokens, imageCalls });
        };

        fetchUsage();

        const channel = supabase
            .channel('llm_usage_events')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'llm_usage_events', filter: `org_id=eq.${orgId}` },
                () => fetchUsage(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId]);

    const today = new Date().toLocaleDateString();

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium">Token Usage</h3>
                <p className="text-sm text-muted-foreground">
                    Today&apos;s usage per model and modality ({today}).
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                        <CardDescription className="text-xs">All text-based calls</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{totals.tokens}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Text Tokens</CardTitle>
                        <CardDescription className="text-xs">Chat, strategy, brand analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{totals.textTokens}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Image Calls</CardTitle>
                        <CardDescription className="text-xs">OpenAI image generations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{totals.imageCalls}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Per-Model Breakdown (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                    {rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No usage recorded yet today.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-muted-foreground border-b">
                                        <th className="py-2 text-left">Provider</th>
                                        <th className="py-2 text-left">Model</th>
                                        <th className="py-2 text-left">Kind</th>
                                        <th className="py-2 text-right">Calls</th>
                                        <th className="py-2 text-right">Input</th>
                                        <th className="py-2 text-right">Output</th>
                                        <th className="py-2 text-right">Total Tokens</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="py-2">{row.provider}</td>
                                            <td className="py-2">{row.model}</td>
                                            <td className="py-2 capitalize">{row.kind}</td>
                                            <td className="py-2 text-right">{row.calls}</td>
                                            <td className="py-2 text-right">{row.inputTokens}</td>
                                            <td className="py-2 text-right">{row.outputTokens}</td>
                                            <td className="py-2 text-right">{row.totalTokens}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

