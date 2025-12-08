'use client';

/**
 * Facebook Pixel Health Dashboard Component
 * Display pixel health status and recommendations
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Zap,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import type { FacebookPixelHealth } from '@/modules/tracking-ai/providers/facebook/types';

interface HealthDashboardProps {
  health: FacebookPixelHealth | null;
  onRefresh: () => void;
}

export function FacebookHealthDashboard({ health, onRefresh }: HealthDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'yellow':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'red':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Info className="h-6 w-6 text-gray-600" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };
  
  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pixel Health
          </CardTitle>
          <CardDescription>
            Run a health check to see your pixel status
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium text-lg mb-2">No health data yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run a health check to analyze your pixel setup
          </p>
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Health Check
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Pixel Health
              </CardTitle>
              <CardDescription>
                Last checked: {health.lastCheckedAt
                  ? new Date(health.lastCheckedAt).toLocaleString()
                  : 'Never'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {/* Health Score */}
            <div className="md:col-span-1">
              <div className={`p-6 rounded-lg ${getStatusColor(health.healthStatus)}`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.healthStatus)}
                  <div>
                    <div className="text-3xl font-bold">{health.healthScore}</div>
                    <div className="text-sm opacity-80">Health Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  {health.pixelActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">Pixel</span>
                </div>
                <div className="text-lg font-bold">
                  {health.pixelActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  {health.capiActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">CAPI</span>
                </div>
                <div className="text-lg font-bold">
                  {health.capiActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Events (24h)</span>
                </div>
                <div className="text-lg font-bold">{health.eventsReceived24h}</div>
              </div>
              
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Match Rate</span>
                </div>
                <div className="text-lg font-bold">
                  {health.matchRate ? `${health.matchRate.toFixed(1)}%` : '-'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Health</span>
              <span className="text-sm text-muted-foreground">{health.healthScore}%</span>
            </div>
            <Progress value={health.healthScore} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      {/* Issues */}
      {health.issues && health.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.issues.map((issue, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{issue.title}</h4>
                      <Badge variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'high' ? 'default' :
                        'secondary'
                      }>
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                    {issue.howToFix && (
                      <p className="text-sm mt-2">
                        <strong>Fix:</strong> {issue.howToFix}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Recommendations */}
      {health.recommendations && health.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant="outline">
                        {rec.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                  {rec.actionUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={rec.actionUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Event Breakdown */}
      {health.diagnostics?.eventBreakdown && Object.keys(health.diagnostics.eventBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Breakdown</CardTitle>
            <CardDescription>Events received in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health.diagnostics.eventBreakdown).map(([event, count]) => (
                <div key={event} className="p-4 rounded-lg border">
                  <div className="text-lg font-bold">{count as number}</div>
                  <div className="text-sm text-muted-foreground">{event}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
