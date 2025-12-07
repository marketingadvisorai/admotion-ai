'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { IntegrationCard } from './integration-card';
import { HealthDashboard } from './health-dashboard';
import { SetupWizard } from './setup-wizard';
import { TrackingPlans } from './tracking-plans';

interface TrackingAIDashboardProps {
  orgId: string;
}

interface Integration {
  id: string;
  provider: string;
  status: string;
  account_id?: string;
  account_name?: string;
  last_sync_at?: string;
}

interface HealthStatus {
  id: string;
  check_type: string;
  status: string;
  message: string;
  auto_fix_available: boolean;
}

export function TrackingAIDashboard({ orgId }: TrackingAIDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch integrations
      const intResponse = await fetch(`/api/tracking-ai/integrations?orgId=${orgId}`);
      const intData = await intResponse.json();
      setIntegrations(intData.integrations || []);

      // Fetch health status
      const healthResponse = await fetch(`/api/tracking-ai/health?orgId=${orgId}`);
      const healthData = await healthResponse.json();
      setHealthStatuses(healthData.healthStatuses || []);
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleRunHealthCheck = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/tracking-ai/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      await fetchData();
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate summary stats
  const googleAdsIntegration = integrations.find(i => i.provider === 'google_ads_mcp');
  const googleAnalyticsIntegration = integrations.find(i => i.provider === 'google_analytics_mcp');
  
  const criticalIssues = healthStatuses.filter(h => h.status === 'critical').length;
  const warnings = healthStatuses.filter(h => h.status === 'warning').length;
  const healthy = healthStatuses.filter(h => h.status === 'healthy').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Tracking AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate your conversion tracking with AI-powered setup and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setActiveTab('wizard')}>
            <Zap className="h-4 w-4 mr-2" />
            AI Setup Wizard
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalIssues > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} found in your tracking setup.
            </span>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('health')}>
              View Issues
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Health
            {(criticalIssues > 0 || warnings > 0) && (
              <Badge variant={criticalIssues > 0 ? 'destructive' : 'secondary'} className="ml-1">
                {criticalIssues + warnings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Plans
          </TabsTrigger>
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Setup Wizard
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Google Ads MCP</CardTitle>
                <Badge variant={googleAdsIntegration?.status === 'connected' ? 'default' : 'secondary'}>
                  {googleAdsIntegration?.status || 'Not Connected'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {googleAdsIntegration?.account_name || 'No Account'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {googleAdsIntegration?.last_sync_at
                    ? `Last synced ${new Date(googleAdsIntegration.last_sync_at).toLocaleDateString()}`
                    : 'Never synced'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Google Analytics MCP</CardTitle>
                <Badge variant={googleAnalyticsIntegration?.status === 'connected' ? 'default' : 'secondary'}>
                  {googleAnalyticsIntegration?.status || 'Not Connected'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {googleAnalyticsIntegration?.account_name || 'No Property'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {googleAnalyticsIntegration?.last_sync_at
                    ? `Last synced ${new Date(googleAnalyticsIntegration.last_sync_at).toLocaleDateString()}`
                    : 'Never synced'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tracking Health</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRunHealthCheck} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {healthy > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{healthy} Healthy</span>
                    </div>
                  )}
                  {warnings > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{warnings} Warnings</span>
                    </div>
                  )}
                  {criticalIssues > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{criticalIssues} Critical</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for managing your tracking setup
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('wizard')}
              >
                <Zap className="h-6 w-6 text-primary" />
                <span className="font-medium">Run AI Setup</span>
                <span className="text-xs text-muted-foreground text-center">
                  Auto-configure tracking
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={handleRunHealthCheck}
              >
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="font-medium">Health Check</span>
                <span className="text-xs text-muted-foreground text-center">
                  Diagnose issues
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('integrations')}
              >
                <Settings className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Manage Integrations</span>
                <span className="text-xs text-muted-foreground text-center">
                  Connect platforms
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                asChild
              >
                <a
                  href="https://ads.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-6 w-6 text-orange-600" />
                  <span className="font-medium">Open Google Ads</span>
                  <span className="text-xs text-muted-foreground text-center">
                    View in platform
                  </span>
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* What Tracking AI Does */}
          <Card>
            <CardHeader>
              <CardTitle>What Tracking AI Does</CardTitle>
              <CardDescription>
                Automate your entire tracking workflow with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Auto-Detect Conversions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Scans your website to find thank-you pages, forms, and purchase flows
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Create Ads Conversions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically creates conversion actions in Google Ads via MCP
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Setup GA4 Events
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Creates and configures GA4 events with proper parameters
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Link GA4 → Ads
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Connects your GA4 property to Google Ads for better attribution
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Monitor Health
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Continuously monitors tracking health and alerts you to issues
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Auto-Fix Issues
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically fixes common tracking problems when detected
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              orgId={orgId}
              provider="google_ads_mcp"
              title="Google Ads MCP"
              description="Connect your Google Ads account to create and manage conversion actions automatically."
              integration={googleAdsIntegration}
              onConnect={fetchData}
              features={[
                'List and manage conversion actions',
                'Create new conversions automatically',
                'Link to GA4 properties',
                'View conversion statistics',
              ]}
              whatWeNeed="Access to your Google Ads account with conversion management permissions."
              whyWeNeed="To create and manage conversion actions that track your marketing goals."
              whatWeDo="Automatically create optimized conversion actions based on your business goals."
            />

            <IntegrationCard
              orgId={orgId}
              provider="google_analytics_mcp"
              title="Google Analytics MCP"
              description="Connect your GA4 property to create events and track user behavior."
              integration={googleAnalyticsIntegration}
              onConnect={fetchData}
              features={[
                'List GA4 properties and streams',
                'Create custom events',
                'Mark events as conversions',
                'Link to Google Ads',
              ]}
              whatWeNeed="Access to your Google Analytics account with edit permissions."
              whyWeNeed="To create events and configure conversion tracking in GA4."
              whatWeDo="Set up comprehensive event tracking that aligns with your conversion goals."
            />

            <IntegrationCard
              orgId={orgId}
              provider="google_tag_manager"
              title="Google Tag Manager"
              description="Connect GTM to deploy tracking tags without code changes."
              integration={integrations.find(i => i.provider === 'google_tag_manager')}
              onConnect={fetchData}
              features={[
                'Create and manage tags',
                'Set up triggers automatically',
                'Deploy without developers',
                'Version control for changes',
              ]}
              whatWeNeed="Access to your GTM container with publish permissions."
              whyWeNeed="To deploy tracking code changes without requiring developer assistance."
              whatWeDo="Create and publish optimized tags and triggers for your tracking needs."
              comingSoon
            />
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <HealthDashboard
            orgId={orgId}
            healthStatuses={healthStatuses}
            onRefresh={handleRunHealthCheck}
            refreshing={refreshing}
          />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <TrackingPlans orgId={orgId} />
        </TabsContent>

        {/* Wizard Tab */}
        <TabsContent value="wizard">
          <SetupWizard
            orgId={orgId}
            integrations={{
              googleAds: googleAdsIntegration,
              googleAnalytics: googleAnalyticsIntegration,
            }}
            onComplete={() => {
              fetchData();
              setActiveTab('plans');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
