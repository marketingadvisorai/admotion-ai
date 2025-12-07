'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Wrench,
  MessageSquare,
} from 'lucide-react';

interface HealthStatus {
  id: string;
  check_type: string;
  status: string;
  message: string;
  auto_fix_available: boolean;
  details?: Record<string, unknown>;
  last_checked_at?: string;
}

interface HealthDashboardProps {
  orgId: string;
  healthStatuses: HealthStatus[];
  onRefresh: () => void;
  refreshing: boolean;
}

const CHECK_TYPE_LABELS: Record<string, string> = {
  conversion_receiving: 'Conversion Tracking',
  event_firing: 'GA4 Events',
  tag_loading: 'Tag Loading',
  pixel_active: 'Pixel Status',
  linking_valid: 'GA4 ↔ Ads Linking',
  enhanced_conversions: 'Enhanced Conversions',
  consent_mode: 'Consent Mode',
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  healthy: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  unknown: { icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export function HealthDashboard({
  orgId,
  healthStatuses,
  onRefresh,
  refreshing,
}: HealthDashboardProps) {
  const handleAutoFix = async (healthStatusId: string) => {
    try {
      const response = await fetch('/api/tracking-ai/health/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthStatusId }),
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        alert(result.message || 'Auto-fix failed');
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
    }
  };

  const handleExplain = async (healthStatusId: string) => {
    // In a real implementation, this would open a modal with AI explanation
    alert('AI explanation feature coming soon!');
  };

  if (healthStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Health</CardTitle>
          <CardDescription>
            Run a health check to diagnose your tracking setup
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No health data available</p>
          <Button onClick={onRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Check...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Health Check
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tracking Health</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and fix issues with your tracking setup
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {healthStatuses.map((status) => {
          const config = STATUS_CONFIG[status.status] || STATUS_CONFIG.unknown;
          const Icon = config.icon;

          return (
            <Card key={status.id} className={config.bg}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {CHECK_TYPE_LABELS[status.check_type] || status.check_type}
                        </h3>
                        <Badge
                          variant={
                            status.status === 'healthy'
                              ? 'default'
                              : status.status === 'warning'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {status.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
                      {status.last_checked_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last checked: {new Date(status.last_checked_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {status.auto_fix_available && status.status !== 'healthy' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAutoFix(status.id)}
                      >
                        <Wrench className="h-4 w-4 mr-1" />
                        Auto-Fix
                      </Button>
                    )}
                    {status.status !== 'healthy' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExplain(status.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Explain
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
