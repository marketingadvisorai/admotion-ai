'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Target,
  ShoppingCart,
  UserPlus,
  Phone,
  FileText,
  MousePointer,
  Calendar,
} from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  status: string;
  account_id?: string;
  account_name?: string;
}

interface SetupWizardProps {
  orgId: string;
  integrations: {
    googleAds?: Integration;
    googleAnalytics?: Integration;
  };
  onComplete: () => void;
}

type GoalType = 'purchase' | 'lead' | 'booking' | 'signup' | 'call' | 'form_submit' | 'custom';

interface Goal {
  type: GoalType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const GOALS: Goal[] = [
  {
    type: 'purchase',
    label: 'Purchase',
    description: 'Track completed purchases and revenue',
    icon: ShoppingCart,
  },
  {
    type: 'lead',
    label: 'Lead Generation',
    description: 'Track form submissions and inquiries',
    icon: Target,
  },
  {
    type: 'booking',
    label: 'Booking',
    description: 'Track appointment or reservation bookings',
    icon: Calendar,
  },
  {
    type: 'signup',
    label: 'Sign Up',
    description: 'Track account registrations',
    icon: UserPlus,
  },
  {
    type: 'call',
    label: 'Phone Call',
    description: 'Track phone call conversions',
    icon: Phone,
  },
  {
    type: 'form_submit',
    label: 'Form Submission',
    description: 'Track contact form submissions',
    icon: FileText,
  },
  {
    type: 'custom',
    label: 'Custom Goal',
    description: 'Define your own conversion goal',
    icon: MousePointer,
  },
];

export function SetupWizard({ orgId, integrations, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adsConnected = integrations.googleAds?.status === 'connected';
  const analyticsConnected = integrations.googleAnalytics?.status === 'connected';

  const toggleGoal = (goal: GoalType) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tracking-ai/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          businessGoals: selectedGoals,
          industry,
          websiteAnalysis: {
            detectedPages: [],
            detectedForms: [],
            detectedEvents: [],
          },
          existingTracking: {
            adsConversions: [],
            ga4Events: [],
            gtmTags: [],
          },
          integrations: {
            googleAds: adsConnected
              ? { status: 'connected', accountId: integrations.googleAds?.account_id }
              : undefined,
            googleAnalytics: analyticsConnected
              ? { status: 'connected', accountId: integrations.googleAnalytics?.account_id }
              : undefined,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return adsConnected || analyticsConnected;
      case 2:
        return selectedGoals.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>AI Setup Wizard</CardTitle>
        </div>
        <CardDescription>
          Let AI configure your tracking in minutes, not hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-24 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Check Integrations */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Check Integrations</h3>
            <p className="text-muted-foreground">
              Make sure your Google accounts are connected before we begin.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div
                className={`p-4 rounded-lg border ${
                  adsConnected ? 'border-green-500 bg-green-50' : 'border-dashed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Google Ads MCP</span>
                  {adsConnected ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                {adsConnected && integrations.googleAds?.account_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {integrations.googleAds.account_name}
                  </p>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border ${
                  analyticsConnected ? 'border-green-500 bg-green-50' : 'border-dashed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Google Analytics MCP</span>
                  {analyticsConnected ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                {analyticsConnected && integrations.googleAnalytics?.account_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {integrations.googleAnalytics.account_name}
                  </p>
                )}
              </div>
            </div>

            {!adsConnected && !analyticsConnected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">No integrations connected</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please connect at least one integration from the Integrations tab before
                    running the AI setup wizard.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Goals */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Select Your Goals</h3>
            <p className="text-muted-foreground">
              What actions do you want to track as conversions?
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.type);

                return (
                  <div
                    key={goal.type}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleGoal(goal.type)}
                  >
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleGoal(goal.type)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{goal.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Additional Info */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Additional Information</h3>
            <p className="text-muted-foreground">
              Help us create a better tracking plan with some context.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website URL (optional)</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll analyze your website to suggest optimal tracking
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry (optional)</Label>
                <Input
                  id="industry"
                  placeholder="e.g., E-commerce, SaaS, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Helps us apply industry-specific best practices
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Goals:</span>{' '}
                  {selectedGoals.map((g) => GOALS.find((goal) => goal.type === g)?.label).join(', ')}
                </p>
                <p>
                  <span className="text-muted-foreground">Google Ads:</span>{' '}
                  {adsConnected ? 'Connected' : 'Not connected'}
                </p>
                <p>
                  <span className="text-muted-foreground">Google Analytics:</span>{' '}
                  {analyticsConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error generating plan</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleGeneratePlan} disabled={generating || !canProceed()}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Plan
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
