'use client';

/**
 * Facebook Event Tester Component
 * Test and validate Facebook events
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Copy,
  Check,
  Info,
  ExternalLink,
} from 'lucide-react';

interface EventTesterProps {
  orgId: string;
}

const SAMPLE_EVENTS = [
  { name: 'PageView', description: 'Track page views' },
  { name: 'ViewContent', description: 'Track content views' },
  { name: 'AddToCart', description: 'Track add to cart' },
  { name: 'Purchase', description: 'Track purchases' },
  { name: 'Lead', description: 'Track leads' },
];

interface TestResult {
  success: boolean;
  eventId: string;
  testEventCode: string;
  response: {
    events_received: number;
    messages?: string[];
  };
}

export function FacebookEventTester({ orgId }: EventTesterProps) {
  const [testing, setTesting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('PageView');
  const [customData, setCustomData] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [testEventCode, setTestEventCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Send test event
  const handleTest = async () => {
    setTesting(true);
    try {
      const eventPayload: Record<string, unknown> = {
        eventName: selectedEvent,
        eventSourceUrl: window.location.href,
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: navigator.userAgent,
        },
      };
      
      // Parse custom data if provided
      if (customData.trim()) {
        try {
          eventPayload.customData = JSON.parse(customData);
        } catch {
          console.warn('Invalid custom data JSON');
        }
      }
      
      const response = await fetch('/api/tracking-ai/facebook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          events: [eventPayload],
        }),
      });
      
      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
        if (data.testEventCode) {
          setTestEventCode(data.testEventCode);
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
      setResults([{
        success: false,
        eventId: '',
        testEventCode: '',
        response: {
          events_received: 0,
          messages: [error instanceof Error ? error.message : 'Test failed'],
        },
      }]);
    } finally {
      setTesting(false);
    }
  };
  
  // Copy test event code
  const handleCopy = async () => {
    if (testEventCode) {
      await navigator.clipboard.writeText(testEventCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Get sample custom data
  const getSampleData = () => {
    const samples: Record<string, object> = {
      PageView: {},
      ViewContent: {
        content_name: 'Test Product',
        content_ids: ['123'],
        content_type: 'product',
        value: 99.99,
        currency: 'USD',
      },
      AddToCart: {
        content_ids: ['123'],
        content_type: 'product',
        value: 99.99,
        currency: 'USD',
        num_items: 1,
      },
      Purchase: {
        content_ids: ['123', '456'],
        content_type: 'product',
        value: 199.99,
        currency: 'USD',
        num_items: 2,
        order_id: 'ORDER-12345',
      },
      Lead: {
        content_name: 'Contact Form Submission',
      },
    };
    
    return JSON.stringify(samples[selectedEvent] || {}, null, 2);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Event Tester
          </CardTitle>
          <CardDescription>
            Send test events to verify your setup is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_EVENTS.map((event) => (
                    <SelectItem key={event.name} value={event.name}>
                      <div className="flex items-center gap-2">
                        <span>{event.name}</span>
                        <span className="text-muted-foreground text-xs">
                          - {event.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Data (JSON)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomData(getSampleData())}
                >
                  Use Sample
                </Button>
              </div>
              <Textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                placeholder='{"value": 99.99, "currency": "USD"}'
                className="font-mono text-sm"
                rows={4}
              />
            </div>
          </div>
          
          {/* Test Button */}
          <Button onClick={handleTest} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Test Event...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Send Test Event
              </>
            )}
          </Button>
          
          {/* Test Event Code */}
          {testEventCode && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Test Event Code</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={testEventCode}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Paste this code in Facebook Events Manager → Test Events to see your test events.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {result.success ? 'Event Sent Successfully' : 'Event Failed'}
                        </span>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.response.events_received} received
                        </Badge>
                      </div>
                      
                      {result.eventId && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Event ID: <code className="font-mono">{result.eventId}</code>
                        </p>
                      )}
                      
                      {result.response.messages && result.response.messages.length > 0 && (
                        <ul className="mt-2 text-sm space-y-1">
                          {result.response.messages.map((msg, i) => (
                            <li key={i} className="text-muted-foreground">{msg}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debugging Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Facebook Events Manager</h4>
              <p className="text-sm text-muted-foreground mb-3">
                View real-time event data and diagnostics
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://business.facebook.com/events_manager"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Events Manager
                </a>
              </Button>
            </div>
            
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Pixel Helper Extension</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Browser extension for debugging pixel events
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Extension
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
