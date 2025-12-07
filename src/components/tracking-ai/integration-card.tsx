'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink, Loader2, Plug, AlertCircle } from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  status: string;
  account_id?: string;
  account_name?: string;
  last_sync_at?: string;
}

interface IntegrationCardProps {
  orgId: string;
  provider: string;
  title: string;
  description: string;
  integration?: Integration;
  onConnect: () => void;
  features: string[];
  whatWeNeed: string;
  whyWeNeed: string;
  whatWeDo: string;
  comingSoon?: boolean;
}

export function IntegrationCard({
  orgId,
  provider,
  title,
  description,
  integration,
  onConnect,
  features,
  whatWeNeed,
  whyWeNeed,
  whatWeDo,
  comingSoon,
}: IntegrationCardProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (comingSoon) return;
    
    setConnecting(true);
    try {
      const endpoint = provider === 'google_ads_mcp'
        ? '/api/tracking-ai/mcp/ads/connect'
        : '/api/tracking-ai/mcp/analytics/connect';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('No auth URL returned');
        setConnecting(false);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnecting(false);
    }
  };

  const isConnected = integration?.status === 'connected';
  const hasError = integration?.status === 'error' || integration?.status === 'expired';

  return (
    <Card className={comingSoon ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {comingSoon ? (
            <Badge variant="outline">Coming Soon</Badge>
          ) : isConnected ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : hasError ? (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {isConnected && integration && (
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-sm font-medium">{integration.account_name || 'Connected Account'}</p>
            {integration.account_id && (
              <p className="text-xs text-muted-foreground">ID: {integration.account_id}</p>
            )}
            {integration.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(integration.last_sync_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Features:</p>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Info Sections */}
        <div className="space-y-3 border-t pt-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">What we need from you</p>
            <p className="text-sm mt-1">{whatWeNeed}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Why we need it</p>
            <p className="text-sm mt-1">{whyWeNeed}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">What Tracking AI will do</p>
            <p className="text-sm mt-1">{whatWeDo}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={onConnect}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
              <Button variant="ghost" size="sm" onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reconnect'
                )}
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={connecting || comingSoon}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Connect {title}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
