'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertCircle, Zap, Settings2, BarChart3, Lock, RefreshCw, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

interface ConversionTrackingProps {
    orgId: string;
}

export function ConversionTracking({ orgId }: ConversionTrackingProps) {
    const [isPixelEnabled, setIsPixelEnabled] = useState(false);
    const [isCapiEnabled, setIsCapiEnabled] = useState(false);
    const [pixelId, setPixelId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [testEventCode, setTestEventCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Tracking settings saved successfully');
        }, 1500);
    };

    const handleTestEvent = () => {
        toast.info('Sending test event to Facebook...');
        // Simulate sending event
        setTimeout(() => {
            toast.success('Test event sent! Check Events Manager.');
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Conversion Tracking</h2>
                    <p className="text-muted-foreground">
                        Setup Facebook Pixel and Conversions API to track user actions accurately.
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <ExternalLinkIcon className="h-4 w-4" />
                    Events Manager
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Pixel Configuration */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        Facebook Pixel
                                    </CardTitle>
                                    <CardDescription>
                                        Basic browser-side tracking for page views and standard events.
                                    </CardDescription>
                                </div>
                                <Switch
                                    checked={isPixelEnabled}
                                    onCheckedChange={setIsPixelEnabled}
                                />
                            </div>
                        </CardHeader>
                        {isPixelEnabled && (
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pixel-id">Pixel ID</Label>
                                    <Input
                                        id="pixel-id"
                                        placeholder="123456789012345"
                                        value={pixelId}
                                        onChange={(e) => setPixelId(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Found in Facebook Business Manager under Data Sources.
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Conversions API Configuration */}
                    <Card className="border-purple-100 bg-purple-50/30">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-purple-600" />
                                        Conversions API (CAPI)
                                    </CardTitle>
                                    <CardDescription>
                                        Server-side tracking for higher accuracy and data control.
                                    </CardDescription>
                                </div>
                                <Switch
                                    checked={isCapiEnabled}
                                    onCheckedChange={setIsCapiEnabled}
                                />
                            </div>
                        </CardHeader>
                        {isCapiEnabled && (
                            <CardContent className="space-y-4">
                                <Alert className="bg-purple-100 border-purple-200 text-purple-900">
                                    <BrainCircuit className="h-4 w-4 text-purple-600" />
                                    <AlertTitle>AI Optimization Active</AlertTitle>
                                    <AlertDescription>
                                        Our AI automatically deduplicates events between Pixel and CAPI to prevent over-reporting.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <Label htmlFor="access-token">System User Access Token</Label>
                                    <Input
                                        id="access-token"
                                        type="password"
                                        placeholder="EAA..."
                                        value={accessToken}
                                        onChange={(e) => setAccessToken(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Generate this in Business Settings {'>'} Users {'>'} System Users.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="test-code">Test Event Code (Optional)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="test-code"
                                            placeholder="TEST12345"
                                            value={testEventCode}
                                            onChange={(e) => setTestEventCode(e.target.value)}
                                        />
                                        <Button variant="secondary" onClick={handleTestEvent}>
                                            Test Event
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Use this to verify server events in the "Test Events" tab of Events Manager.
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* AI Event Mapping */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                AI Event Mapping
                            </CardTitle>
                            <CardDescription>
                                Automatically map your app actions to Facebook Standard Events.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-sm">Detected App Events</h4>
                                        <Badge variant="outline" className="gap-1">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            Live Analysis
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { name: 'user_signup', match: 'CompleteRegistration', score: 98 },
                                            { name: 'plan_purchase', match: 'Purchase', score: 95 },
                                            { name: 'add_to_cart', match: 'AddToCart', score: 99 },
                                            { name: 'view_content', match: 'ViewContent', score: 92 },
                                        ].map((event) => (
                                            <div key={event.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center text-xs font-mono text-slate-500">
                                                        {event.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{event.name}</p>
                                                        <p className="text-xs text-slate-500">App Event</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-blue-600">{event.match}</p>
                                                        <p className="text-xs text-slate-500">{event.score}% Match Confidence</p>
                                                    </div>
                                                    <Switch defaultChecked />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button size="lg" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Tracking Settings'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Sidebar Guide */}
                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-base">Setup Guide</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. Create a Pixel</h4>
                                <p className="text-slate-600">
                                    Go to Facebook Events Manager and create a new Web Data Source (Pixel).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">2. Generate Access Token</h4>
                                <p className="text-slate-600">
                                    In Settings, scroll down to Conversions API and click "Generate Access Token".
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">3. Verify Domain</h4>
                                <p className="text-slate-600">
                                    Ensure your domain is verified in Business Manager Brand Safety settings.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Lock className="h-4 w-4 text-green-600" />
                                Data Privacy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-2">
                            <p>
                                All user data sent to CAPI is hashed (SHA-256) before transmission to ensure privacy compliance.
                            </p>
                            <p>
                                We automatically handle:
                            </p>
                            <ul className="list-disc list-inside ml-2 text-xs space-y-1">
                                <li>Email Hashing</li>
                                <li>Phone Hashing</li>
                                <li>IP Address Anonymization</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ExternalLinkIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}
