'use client';

/**
 * Facebook CAPI Settings Component
 * Configure and manage Conversions API settings
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import type { FacebookCapiSettings as CapiSettingsType } from '@/modules/tracking-ai/providers/facebook/types';

interface CapiSettingsProps {
  orgId: string;
  pixelId: string;
}

export function FacebookCapiSettings({ orgId, pixelId }: CapiSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CapiSettingsType | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking-ai/facebook/capi?orgId=${orgId}`);
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch CAPI settings:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);
  
  useEffect(() => {
    if (pixelId) {
      fetchSettings();
    }
  }, [pixelId, fetchSettings]);
  
  // Enable CAPI
  const handleEnable = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/tracking-ai/facebook/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, pixelId }),
      });
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to enable CAPI:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Update settings
  const handleUpdate = async (updates: Partial<CapiSettingsType>) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/tracking-ai/facebook/capi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settingsId: settings.id, ...updates }),
      });
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Copy test event code
  const handleCopyTestCode = async () => {
    if (settings?.testEventCode) {
      await navigator.clipboard.writeText(settings.testEventCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Not enabled
  if (!settings || !settings.capiEnabled) {
    return (
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Enable Conversions API</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Send server-side events for improved attribution, better match rates,
            and more reliable tracking even with ad blockers.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-lg border">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Better Match Rate</h4>
              <p className="text-sm text-muted-foreground">
                30%+ improvement in attribution
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Ad Blocker Proof</h4>
              <p className="text-sm text-muted-foreground">
                Track events that browsers block
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Deduplication</h4>
              <p className="text-sm text-muted-foreground">
                Automatic event_id matching
              </p>
            </div>
          </div>
          
          <Button onClick={handleEnable} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Enable Conversions API
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Enabled - show settings
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Conversions API Settings
              </CardTitle>
              <CardDescription>
                Configure server-side event sending
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">{settings.eventsSent24h || 0}</div>
              <div className="text-sm text-muted-foreground">Events Sent (24h)</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">{settings.eventsFailed24h || 0}</div>
              <div className="text-sm text-muted-foreground">Failed (24h)</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">
                {settings.lastEventSentAt
                  ? new Date(settings.lastEventSentAt).toLocaleTimeString()
                  : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Last Event</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold flex items-center gap-2">
                {settings.hashUserData ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Hashing Enabled</div>
            </div>
          </div>
          
          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Hash User Data</Label>
                <p className="text-sm text-muted-foreground">
                  SHA-256 hash PII before sending (required)
                </p>
              </div>
              <Switch
                checked={settings.hashUserData}
                onCheckedChange={(checked) => handleUpdate({ hashUserData: checked })}
                disabled={saving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include fbc/fbp Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Send Facebook click and browser IDs
                </p>
              </div>
              <Switch
                checked={settings.includeFbcFbp}
                onCheckedChange={(checked) => handleUpdate({ includeFbcFbp: checked })}
                disabled={saving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Send events to test endpoint
                </p>
              </div>
              <Switch
                checked={settings.sendTestEvents}
                onCheckedChange={(checked) => handleUpdate({ sendTestEvents: checked })}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Event Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Event Code</CardTitle>
          <CardDescription>
            Use this code in Facebook Events Manager to debug events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={settings.testEventCode || ''}
              readOnly
              className="font-mono"
            />
            <Button variant="outline" onClick={handleCopyTestCode}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Paste this code in Facebook Events Manager &gt; Test Events to see 
              real-time event debugging.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
