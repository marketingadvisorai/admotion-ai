'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { getOrgSecretsAction, saveOrgSecretAction, deleteOrgSecretAction, OrgSecret } from '@/modules/organizations/actions';
import { toast } from 'sonner';

interface IntegrationsSettingsProps {
    orgId: string;
}

interface IntegrationConfig {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    placeholder?: string;
    helperText?: string;
    usage?: {
        models: string[];
        calls: number;
        cost: string;
    };
}

const SUPPORTED_INTEGRATIONS: IntegrationConfig[] = [
    {
        id: 'OPENAI_API_KEY',
        name: 'OpenAI (GPT-4 / Sora)',
        description: 'Connect your OpenAI account for text generation and video creation (Sora).',
        icon: Key,
        placeholder: 'sk-...',
        helperText: 'Used for agents and brand analysis. If not set, the workspace falls back to the global OPENAI_API_KEY env variable.',
    },
    {
        id: 'GOOGLE_GEMINI_API_KEY',
        name: 'Google Gemini AI',
        description: 'Access Google\'s Gemini models for advanced reasoning and multimodal tasks.',
        icon: Key,
        placeholder: 'AIza...',
        usage: {
            models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
            calls: 1240,
            cost: '$4.50'
        }
    },
    {
        id: 'GOOGLE_GEMINI_VEO_API_KEY',
        name: 'Google Gemini Veo',
        description: 'Specialized video generation model by Google DeepMind.',
        icon: Key,
        placeholder: 'AIza...',
        usage: {
            models: ['veo-1.0'],
            calls: 12,
            cost: '$12.00'
        }
    },
    {
        id: 'NANO_BANANA_API_KEY',
        name: 'Nano Banana AI',
        description: 'Specialized image generation and editing API.',
        icon: Key,
        placeholder: 'banana_...',
        usage: {
            models: ['stable-diffusion-xl', 'flux-pro'],
            calls: 850,
            cost: '$8.50'
        }
    },
    {
        id: 'GOOGLE_ADS_DEVELOPER_TOKEN',
        name: 'Google Ads',
        description: 'Connect Google Ads for campaign management. Requires Developer Token.',
        icon: Key,
        placeholder: 'xxxxxx~yyyyyyyyyyyy',
    },
    {
        id: 'FACEBOOK_ADS_ACCESS_TOKEN',
        name: 'Facebook Ads',
        description: 'Connect Facebook Ads Manager. Requires User or System User Access Token.',
        icon: Key,
        placeholder: 'EAABsbCS1iHgBA...',
    },
    {
        id: 'RUNWAY_ML_API_KEY',
        name: 'Runway ML',
        description: 'Generate and edit videos using Runway\'s Gen-2 and Gen-3 models.',
        icon: Key,
    },
    {
        id: 'KLING_AI_API_KEY',
        name: 'Kling AI',
        description: 'High-quality video generation API.',
        icon: Key,
    },
];

import { getApiUsageStatsAction, ApiUsageStats } from '@/modules/analytics/actions';

// ... (imports remain the same)

export function IntegrationsSettings({ orgId }: IntegrationsSettingsProps) {
    const [secrets, setSecrets] = useState<OrgSecret[]>([]);
    const [usageStats, setUsageStats] = useState<ApiUsageStats>({});
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempKey, setTempKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [orgId]);

    const loadData = async () => {
        setIsLoading(true);
        const [secretsResult, usageResult] = await Promise.all([
            getOrgSecretsAction(orgId),
            getApiUsageStatsAction(orgId)
        ]);

        if (secretsResult.success && secretsResult.data) {
            setSecrets(secretsResult.data);
        } else {
            toast.error('Failed to load integrations');
        }

        if (usageResult.success && usageResult.data) {
            setUsageStats(usageResult.data);
        }

        setIsLoading(false);
    };

    const handleSave = async (name: string) => {
        if (!tempKey) return;

        setIsSaving(true);
        const result = await saveOrgSecretAction(orgId, name, tempKey);
        if (result.success) {
            toast.success(`${name} saved successfully`);
            setEditingId(null);
            setTempKey('');
            loadData();
        } else {
            toast.error(result.error || 'Failed to save key');
        }
        setIsSaving(false);
    };

    const handleDelete = async (name: string) => {
        if (!confirm('Are you sure you want to disconnect this integration?')) return;

        const result = await deleteOrgSecretAction(orgId, name);
        if (result.success) {
            toast.success('Integration disconnected');
            loadData();
        } else {
            toast.error(result.error || 'Failed to disconnect');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integrations</h3>
                <p className="text-sm text-muted-foreground">
                    Manage external services and API keys for your organization. Keys are stored per workspace and only shown here in masked form.
                </p>
            </div>

            <div className="grid gap-4">
                {SUPPORTED_INTEGRATIONS.map((integration) => {
                    const secret = secrets.find(s => s.name === integration.id);
                    const isConnected = !!secret;
                    const usage = usageStats[integration.id];

                    return (
                        <Card key={integration.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                {/* ... (Header content remains the same) */}
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        {integration.name}
                                        {isConnected ? (
                                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                Not Connected
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>{integration.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isConnected && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(integration.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Dialog open={editingId === integration.id} onOpenChange={(open) => {
                                        if (open) setEditingId(integration.id);
                                        else {
                                            setEditingId(null);
                                            setTempKey('');
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant={isConnected ? "outline" : "default"}>
                                                {isConnected ? 'Configure' : 'Connect'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Configure {integration.name}</DialogTitle>
                                                <DialogDescription>
                                                    Enter your API key below. It will be stored securely and only used for this workspace.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>API Key</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder={integration.placeholder || 'Paste API key'}
                                                        value={tempKey}
                                                        onChange={(e) => setTempKey(e.target.value)}
                                                    />
                                                    {isConnected && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Stored key (masked): {secret?.value}
                                                        </p>
                                                    )}
                                                    {integration.helperText && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {integration.helperText}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={() => handleSave(integration.id)}
                                                    disabled={!tempKey || isSaving}
                                                >
                                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Key
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            {isConnected && usage && (
                                <CardContent className="pt-4 border-t mt-4 bg-gray-50/50">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex gap-4">
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Models</span>
                                                <div className="flex gap-1 mt-1">
                                                    {usage.models.map((m: string) => (
                                                        <span key={m} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Calls</span>
                                                <span className="font-mono text-gray-900 mt-1 block">{usage.calls.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Est. Cost</span>
                                                <span className="font-mono text-gray-900 mt-1 block">{usage.cost}</span>
                                            </div>
                                        </div>
                                        <Button variant="link" size="sm" className="text-xs text-gray-500 h-auto p-0">
                                            View Logs
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
