'use client';

/**
 * Facebook Tracking Page
 * Complete Facebook Pixel and Conversions API management
 */

import { useEffect, useState, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Facebook, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Loader2,
  RefreshCw,
  Zap,
  Settings,
  Activity,
  Code,
  TestTube,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { FacebookPixelSelector } from '@/components/tracking-ai/facebook/pixel-selector';
import { FacebookCapiSettings } from '@/components/tracking-ai/facebook/capi-settings';
import { FacebookEventMappings } from '@/components/tracking-ai/facebook/event-mappings';
import { FacebookEventTester } from '@/components/tracking-ai/facebook/event-tester';
import { FacebookHealthDashboard } from '@/components/tracking-ai/facebook/health-dashboard';
import type { 
  FacebookIntegration, 
  FacebookPixelHealth,
  FacebookPixel,
} from '@/modules/tracking-ai/providers/facebook/types';

interface FacebookPageProps {
  params: Promise<{ orgId: string }>;
}

export default function FacebookTrackingPage({ params }: FacebookPageProps) {
  const { orgId } = use(params);
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('success');
  
  // State
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [integration, setIntegration] = useState<FacebookIntegration | null>(null);
  const [pixels, setPixels] = useState<FacebookPixel[]>([]);
  const [health, setHealth] = useState<FacebookPixelHealth | null>(null);
  const [activeTab, setActiveTab] = useState('connection');
  const [copied, setCopied] = useState(false);
  
  // Fetch integration status
  const fetchIntegration = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking-ai/facebook/integration?orgId=${orgId}`);
      const data = await response.json();
      
      if (data.connected && data.integration) {
        setIntegration(data.integration);
        
        // Fetch pixels if connected
        const pixelsResponse = await fetch(`/api/tracking-ai/facebook/pixels?orgId=${orgId}`);
        const pixelsData = await pixelsResponse.json();
        setPixels(pixelsData.pixels || []);
        
        // Fetch health if pixel selected
        if (data.integration.pixelId) {
          const healthResponse = await fetch(
            `/api/tracking-ai/facebook/pixels/health?orgId=${orgId}&pixelId=${data.integration.pixelId}`
          );
          const healthData = await healthResponse.json();
          setHealth(healthData.health);
        }
      }
    } catch (error) {
      console.error('Failed to fetch integration:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);
  
  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);
  
  // Connect to Facebook
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/tracking-ai/facebook/connect', {
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
  
  // Disconnect from Facebook
  const handleDisconnect = async () => {
    if (!integration) return;
    
    try {
      await fetch(`/api/tracking-ai/facebook/integration?integrationId=${integration.id}`, {
        method: 'DELETE',
      });
      
      setIntegration(null);
      setPixels([]);
      setHealth(null);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };
  
  // Refresh health check
  const handleRefreshHealth = async () => {
    try {
      const response = await fetch('/api/tracking-ai/facebook/pixels/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      
      const data = await response.json();
      setHealth(data.health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };
  
  // Copy pixel code
  const handleCopyCode = async () => {
    if (!integration?.pixelId) return;
    
    try {
      const response = await fetch(
        `/api/tracking-ai/facebook/pixels/${integration.pixelId}/code?orgId=${orgId}`
      );
      const data = await response.json();
      
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  const isConnected = !!integration;
  const hasPixel = !!integration?.pixelId;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Facebook className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Facebook Tracking</h1>
            <p className="text-muted-foreground">
              Manage Facebook Pixel and Conversions API
            </p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected as {integration.facebookUserName}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}
      </div>
      
      {/* Success message */}
      {successMessage === 'facebook_connected' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Successfully connected!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your Facebook account is now connected. Select a pixel to get started.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Not Connected State */}
      {!isConnected && (
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Facebook className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Connect Facebook</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Connect your Facebook account to enable Pixel tracking and 
              Conversions API for better attribution and optimization.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-lg border bg-muted/50">
                <Zap className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">Browser Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Install Pixel for client-side events
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50">
                <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">Server Events</h4>
                <p className="text-sm text-muted-foreground">
                  Send events via Conversions API
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">AI Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Auto-generate event mappings
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We&apos;ll request access to manage your ads and pixels.
              </p>
              <Button 
                size="lg" 
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="h-4 w-4 mr-2" />
                    Connect with Facebook
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Connected State */}
      {isConnected && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="connection" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Connection</span>
            </TabsTrigger>
            <TabsTrigger value="capi" className="gap-2" disabled={!hasPixel}>
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">CAPI</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2" disabled={!hasPixel}>
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2" disabled={!hasPixel}>
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Test</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2" disabled={!hasPixel}>
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pixel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Pixel</CardTitle>
                  <CardDescription>
                    Choose the Facebook Pixel to use for tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FacebookPixelSelector
                    orgId={orgId}
                    pixels={pixels}
                    selectedPixelId={integration.pixelId}
                    onSelect={async (pixelId) => {
                      setIntegration({ ...integration, pixelId });
                      // Refresh health
                      setTimeout(handleRefreshHealth, 1000);
                    }}
                  />
                </CardContent>
              </Card>
              
              {/* Pixel Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Installation Code</CardTitle>
                  <CardDescription>
                    Add this code to your website&apos;s &lt;head&gt; section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasPixel ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
                        <code className="text-muted-foreground">
                          &lt;!-- Meta Pixel Code --&gt;
                          <br />
                          &lt;script&gt;...&lt;/script&gt;
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleCopyCode}
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </>
                          )}
                        </Button>
                        <Button variant="outline" asChild>
                          <a 
                            href={`https://business.facebook.com/events_manager2/list/pixel/${integration.pixelId}/settings`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View in Facebook
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Select a pixel to see installation code</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            {hasPixel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with Facebook tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto py-4"
                      onClick={() => setActiveTab('capi')}
                    >
                      <div className="flex items-start gap-3">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">Enable CAPI</div>
                          <div className="text-sm text-muted-foreground">
                            Set up server-side events
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto py-4"
                      onClick={() => setActiveTab('events')}
                    >
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">Map Events</div>
                          <div className="text-sm text-muted-foreground">
                            Configure event tracking
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto py-4"
                      onClick={() => setActiveTab('test')}
                    >
                      <div className="flex items-start gap-3">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">Test Events</div>
                          <div className="text-sm text-muted-foreground">
                            Verify your setup
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* CAPI Tab */}
          <TabsContent value="capi">
            <FacebookCapiSettings
              orgId={orgId}
              pixelId={integration.pixelId || ''}
            />
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <FacebookEventMappings orgId={orgId} />
          </TabsContent>
          
          {/* Test Tab */}
          <TabsContent value="test">
            <FacebookEventTester orgId={orgId} />
          </TabsContent>
          
          {/* Health Tab */}
          <TabsContent value="health">
            <FacebookHealthDashboard
              health={health}
              onRefresh={handleRefreshHealth}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
