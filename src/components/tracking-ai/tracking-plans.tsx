'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  Play,
  AlertTriangle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Tag,
} from 'lucide-react';

interface TrackingPlan {
  id: string;
  name: string;
  description: string;
  status: string;
  execution_progress: number;
  plan_data: {
    adsConversions: Array<{ name: string; category: string; reason: string }>;
    ga4Events: Array<{ eventName: string; markAsConversion: boolean; reason: string }>;
    gtmTags: Array<{ name: string; type: string; reason: string }>;
    recommendations: Array<{ title: string; description: string; priority: string }>;
    linkAdsToGa4: boolean;
  };
  ai_model: string;
  confidence_score: number;
  created_at: string;
  executed_at?: string;
  completed_at?: string;
}

interface TrackingPlansProps {
  orgId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  executing: { label: 'Executing', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function TrackingPlans({ orgId }: TrackingPlansProps) {
  const [plans, setPlans] = useState<TrackingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking-ai/plans?orgId=${orgId}`);
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleExecute = async (planId: string) => {
    setExecuting(planId);
    try {
      await fetch(`/api/tracking-ai/plans/${planId}/execute`, {
        method: 'POST',
      });
      // Poll for status updates
      const interval = setInterval(async () => {
        await fetchPlans();
        const plan = plans.find((p) => p.id === planId);
        if (plan && (plan.status === 'completed' || plan.status === 'failed' || plan.status === 'partial')) {
          clearInterval(interval);
          setExecuting(null);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to execute plan:', error);
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Tracking Plans</CardTitle>
          <CardDescription>
            No plans generated yet. Use the Setup Wizard to create your first plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tracking plans available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Tracking Plans</h2>
          <p className="text-sm text-muted-foreground">
            Review and execute AI-generated tracking configurations
          </p>
        </div>
        <Button variant="outline" onClick={fetchPlans}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const isExpanded = expandedPlan === plan.id;
          const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.draft;
          const isExecuting = executing === plan.id || plan.status === 'executing';

          return (
            <Card key={plan.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      {plan.plan_data.adsConversions.length} Conversions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {plan.plan_data.ga4Events.length} GA4 Events
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      {plan.plan_data.gtmTags.length} GTM Tags
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">
                      {Math.round(plan.confidence_score * 100)}% Confidence
                    </span>
                  </div>
                </div>

                {/* Progress Bar (if executing) */}
                {isExecuting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Execution Progress</span>
                      <span>{plan.execution_progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${plan.execution_progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Details */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      View Details
                    </>
                  )}
                </Button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Conversions */}
                    {plan.plan_data.adsConversions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Google Ads Conversions
                        </h4>
                        <div className="space-y-2">
                          {plan.plan_data.adsConversions.map((conv, i) => (
                            <div key={i} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{conv.name}</span>
                                <Badge variant="outline">{conv.category}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {conv.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GA4 Events */}
                    {plan.plan_data.ga4Events.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          GA4 Events
                        </h4>
                        <div className="space-y-2">
                          {plan.plan_data.ga4Events.map((event, i) => (
                            <div key={i} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between">
                                <code className="font-medium">{event.eventName}</code>
                                {event.markAsConversion && (
                                  <Badge variant="default">Conversion</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {plan.plan_data.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {plan.plan_data.recommendations.map((rec, i) => (
                            <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{rec.title}</span>
                                <Badge variant="outline">{rec.priority}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Created {new Date(plan.created_at).toLocaleDateString()}
                    {plan.ai_model && ` • AI: ${plan.ai_model}`}
                  </div>
                  <div className="flex gap-2">
                    {(plan.status === 'draft' || plan.status === 'approved') && (
                      <Button
                        size="sm"
                        onClick={() => handleExecute(plan.id)}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute Plan
                          </>
                        )}
                      </Button>
                    )}
                    {plan.status === 'completed' && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Executed Successfully
                      </Badge>
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
