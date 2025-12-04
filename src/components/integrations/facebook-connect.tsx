'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Facebook,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Megaphone,
    Target,
    HelpCircle,
    ExternalLink,
    RefreshCw,
    Building2,
    Lock,
    Globe,
    KeyRound,
    ShieldCheck,
    Clock3,
    ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';

type FlowStepStatus = 'pending' | 'active' | 'done';

interface FlowStep {
    title: string;
    description: string;
    status: FlowStepStatus;
}

interface FacebookConnectProps {
    orgId: string;
}

export function FacebookConnect({ orgId }: FacebookConnectProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progressIndex, setProgressIndex] = useState(-1);

    const workspaceLabel = useMemo(() => (orgId ? `Workspace ${orgId}` : 'this workspace'), [orgId]);

    const scopes = useMemo(
        () => [
            'pages_show_list',
            'pages_read_engagement',
            'pages_read_user_content',
            'pages_manage_metadata',
            'ads_read',
            'business_management',
        ],
        [],
    );

    const baseFlow: FlowStep[] = useMemo(
        () => [
            {
                title: 'Open Facebook Login',
                description: 'Launch /dialog/oauth with the scopes below and your redirect URI.',
                status: 'pending',
            },
            {
                title: 'Exchange the code',
                description: 'Swap the code for a short-lived token, then for a long-lived user token.',
                status: 'pending',
            },
            {
                title: 'Fetch assets',
                description: 'GET /me/accounts for Pages (and Page tokens) + GET /me/businesses for BMs/Ad Accounts.',
                status: 'pending',
            },
            {
                title: 'Store & map',
                description: 'Encrypt tokens, map Page IDs to BM + Ad Accounts, and show the user what is connected.',
                status: 'pending',
            },
            {
                title: 'Optional: Partner share',
                description: 'If server-to-server is needed, request partner BM share and issue a System User token.',
                status: 'pending',
            },
        ],
        [],
    );

    const flowSteps = useMemo(() => {
        if (progressIndex === -1) return baseFlow;
        const lastIndex = baseFlow.length;

        return baseFlow.map((step, index) => {
            if (progressIndex === lastIndex) {
                return { ...step, status: 'done' as FlowStepStatus };
            }

            if (index < progressIndex) {
                return { ...step, status: 'done' as FlowStepStatus };
            }

            if (index === progressIndex) {
                return { ...step, status: 'active' as FlowStepStatus };
            }

            return { ...step, status: 'pending' as FlowStepStatus };
        });
    }, [progressIndex, baseFlow]);

    const runFlow = (connectAfter: boolean) => {
        setProgressIndex(0);

        const totalSteps = baseFlow.length;
        const stepDelay = 650;

        for (let i = 1; i <= totalSteps; i += 1) {
            setTimeout(() => {
                if (i === totalSteps) {
                    setProgressIndex(totalSteps);
                    if (connectAfter) {
                        setIsConnected(true);
                        setIsLoading(false);
                        toast.success('Facebook connected. Pages and Business assets will be pulled next.');
                    }
                } else {
                    setProgressIndex(i);
                }
            }, i * stepDelay);
        }
    };

    const handleConnect = () => {
        setIsLoading(true);
        runFlow(true);
    };

    const handleDisconnect = () => {
        if (confirm('Are you sure you want to disconnect?')) {
            setIsConnected(false);
            setProgressIndex(-1);
            toast.success('Disconnected from Facebook.');
        }
    };

    const assetCalls = [
        {
            title: '/me/accounts',
            detail: 'Lists Pages and returns Page access tokens (use these tokens for Page insights and publishing).',
        },
        {
            title: '/me/businesses',
            detail: 'Lists Business Managers the user can see; use to show which BM will share assets.',
        },
        {
            title: '/act_<id>/insights',
            detail: 'Read-only ad account insights with the user token + ads_read (add breakdowns carefully).',
        },
        {
            title: '/<page_id>/insights',
            detail: 'Page impressions, engagement, video views using the Page token.',
        },
    ];

    if (!isConnected) {
        return (
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Facebook className="h-6 w-6 text-blue-600" />
                            Connect Facebook & Business Manager
                        </CardTitle>
                        <CardDescription>
                            Users click once, approve scopes, and we pull their Pages and Business assets into {workspaceLabel}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                What happens when they click connect
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 ml-1">
                                <li>Open Facebook Login with the scopes below.</li>
                                <li>Exchange the code for a long-lived user token.</li>
                                <li>Pull Pages (`/me/accounts`) and Business Managers (`/me/businesses`).</li>
                                <li>Store encrypted tokens and map assets to this workspace.</li>
                                <li>Optional: ask the partner BM admin to approve a partner share for server-to-server access.</li>
                            </ol>
                        </div>

                        <div className="rounded-lg border border-dashed border-gray-200 p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Scopes requested (Phase 1)</p>
                            <div className="flex flex-wrap gap-2">
                                {scopes.map((scope) => (
                                    <Badge key={scope} variant="secondary" className="bg-gray-100 text-gray-700">
                                        {scope}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Add `pages_manage_ads` + `ads_management` only when we need to create/boost ads. Keep initial ask small.
                            </p>
                        </div>

                        <Alert>
                            <HelpCircle className="h-4 w-4" />
                            <AlertTitle>Prerequisites for the user</AlertTitle>
                            <AlertDescription className="space-y-1">
                                <p>They must be an admin on the Pages and Ad Accounts they want to share.</p>
                                <p>They should be added to each Business Manager they want to expose; otherwise `/me/businesses` returns empty.</p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Tokens are stored encrypted and rotated when revoked.
                        </div>
                        <Button
                            className="w-full sm:w-auto bg-[#1877F2] hover:bg-[#166fe5]"
                            onClick={handleConnect}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connecting…' : 'Connect with Facebook'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Connection runbook
                        </CardTitle>
                        <CardDescription>Use this sequence in your backend when the user finishes login.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <KeyRound className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Token exchange</p>
                                <p className="text-xs text-gray-600">Code → short-lived token → long-lived user token; store securely.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Fetch assets immediately</p>
                                <p className="text-xs text-gray-600">`/me/accounts` for Pages + tokens, `/me/businesses` for BMs, and `/me/adaccounts` if needed.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Lock className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Map + limit access</p>
                                <p className="text-xs text-gray-600">Only enable the Pages/Ad Accounts the user selects. Keep scopes minimal until App Review clears broader access.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock3 className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Plan for App Review</p>
                                <p className="text-xs text-gray-600">Provide a screencast: login → select assets → view insights. Add publishing/ads scopes later if required.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                            <Facebook className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900">Facebook Connected</h3>
                            <p className="text-sm text-blue-700">
                                Linked to {workspaceLabel}. User token and Page tokens are ready; BM partner share optional.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-white text-blue-700 border border-blue-200">Phase 1: Read-only</Badge>
                        <Button
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="h-5 w-5 text-blue-600" />
                                Connection pipeline
                            </CardTitle>
                            <CardDescription>What we already ran and what to keep for production.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-600" onClick={() => runFlow(false)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Replay steps
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {flowSteps.map((step) => (
                            <div
                                key={step.title}
                                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 bg-white"
                            >
                                <StatusIcon status={step.status} />
                                <div>
                                    <p className="font-medium text-gray-900">{step.title}</p>
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            Use the tokens now
                        </CardTitle>
                        <CardDescription>Run these calls immediately after connection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-700">
                        {assetCalls.map((call) => (
                            <div key={call.title} className="rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <code className="text-xs font-semibold text-gray-900">{call.title}</code>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                        Read
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">{call.detail}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-blue-600" />
                            Access control & partner share
                        </CardTitle>
                        <CardDescription>How to let a client BM grant us access after they click connect.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="h-4 w-4 mt-0.5 text-gray-500" />
                            <p>Add their BM ID as a partner in our BM, choose Pages + Ad Accounts to share, and have their admin accept.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                            <p>Without partner share, we rely on user tokens. That works for insights, but server-to-server posting/ads needs BM sharing.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 mt-0.5 text-gray-500" />
                            <p>Once shared, create a System User token scoped to those assets for background jobs.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-gray-600" />
                            What the user sees
                        </CardTitle>
                        <CardDescription>Make this transparent in the UI so they trust the flow.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                            <p>Popup shows scopes and lets them pick which Pages/Ad Accounts to share (recommend “All” for smoother ops).</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Target className="h-4 w-4 mt-0.5 text-gray-500" />
                            <p>After redirect, display the Pages and Ad Accounts detected so they can confirm what we will use.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <HelpCircle className="h-4 w-4 mt-0.5 text-gray-500" />
                            <p>Offer a “Need Business Manager access?” link with instructions for partner sharing and who should approve.</p>
                        </div>
                        <Separator />
                        <p className="text-xs text-gray-500">
                            Implementation tip: front-end builds the login URL; backend handles token exchange and asset fetch; store granted scopes and show revocation/refresh options.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: FlowStepStatus }) {
    if (status === 'done') {
        return (
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
            </div>
        );
    }

    if (status === 'active') {
        return (
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
            <Clock3 className="h-4 w-4" />
        </div>
    );
}
