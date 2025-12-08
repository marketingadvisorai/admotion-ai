'use client';

/**
 * Facebook Event Mappings Component
 * Manage event mappings between website actions and Facebook events
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import type { 
  FacebookEventMapping,
  FacebookTriggerType,
} from '@/modules/tracking-ai/providers/facebook/types';

interface EventMappingsProps {
  orgId: string;
}

const STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'Schedule',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
];

const TRIGGER_TYPES: { value: FacebookTriggerType; label: string }[] = [
  { value: 'url_match', label: 'URL Match' },
  { value: 'css_selector', label: 'CSS Selector' },
  { value: 'form_submit', label: 'Form Submit' },
  { value: 'click', label: 'Click' },
  { value: 'custom_event', label: 'Custom Event' },
];

export function FacebookEventMappings({ orgId }: EventMappingsProps) {
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<FacebookEventMapping[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMapping, setEditingMapping] = useState<FacebookEventMapping | null>(null);
  
  // Form state
  const [eventName, setEventName] = useState('');
  const [triggerType, setTriggerType] = useState<FacebookTriggerType>('url_match');
  const [triggerValue, setTriggerValue] = useState('');
  const [dedupeEnabled, setDedupeEnabled] = useState(true);
  
  // Fetch mappings
  const fetchMappings = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking-ai/facebook/mappings?orgId=${orgId}`);
      const data = await response.json();
      setMappings(data.mappings || []);
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);
  
  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);
  
  // Reset form
  const resetForm = () => {
    setEventName('');
    setTriggerType('url_match');
    setTriggerValue('');
    setDedupeEnabled(true);
    setEditingMapping(null);
  };
  
  // Open edit dialog
  const openEdit = (mapping: FacebookEventMapping) => {
    setEditingMapping(mapping);
    setEventName(mapping.eventName);
    setTriggerType(mapping.triggerType);
    setTriggerValue(mapping.triggerValue);
    setDedupeEnabled(mapping.dedupeEnabled);
    setDialogOpen(true);
  };
  
  // Save mapping
  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingMapping) {
        // Update
        await fetch(`/api/tracking-ai/facebook/mappings/${editingMapping.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName,
            triggerType,
            triggerValue,
            dedupeEnabled,
          }),
        });
      } else {
        // Create
        await fetch('/api/tracking-ai/facebook/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId,
            eventName,
            triggerType,
            triggerValue,
            dedupeEnabled,
          }),
        });
      }
      
      await fetchMappings();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save mapping:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Delete mapping
  const handleDelete = async (mappingId: string) => {
    try {
      await fetch(`/api/tracking-ai/facebook/mappings/${mappingId}`, {
        method: 'DELETE',
      });
      await fetchMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };
  
  // Toggle mapping
  const handleToggle = async (mapping: FacebookEventMapping) => {
    try {
      await fetch(`/api/tracking-ai/facebook/mappings/${mapping.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !mapping.isActive }),
      });
      await fetchMappings();
    } catch (error) {
      console.error('Failed to toggle mapping:', error);
    }
  };
  
  // Get AI suggestions
  const handleGetSuggestions = async () => {
    try {
      const response = await fetch(
        `/api/tracking-ai/facebook/suggestions?goals=purchase,lead,signup`
      );
      const data = await response.json();
      console.log('Suggestions:', data.suggestions);
      // TODO: Show suggestions in UI
    } catch (error) {
      console.error('Failed to get suggestions:', error);
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
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Event Mappings
            </CardTitle>
            <CardDescription>
              Map website actions to Facebook events
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGetSuggestions}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMapping ? 'Edit Event Mapping' : 'Create Event Mapping'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure when to fire this Facebook event
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Select value={eventName} onValueChange={setEventName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARD_EVENTS.map((event) => (
                          <SelectItem key={event} value={event}>
                            {event}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={triggerType}
                      onValueChange={(v) => setTriggerType(v as FacebookTriggerType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>
                      {triggerType === 'url_match' && 'URL Pattern'}
                      {triggerType === 'css_selector' && 'CSS Selector'}
                      {triggerType === 'form_submit' && 'Form Selector'}
                      {triggerType === 'click' && 'Element Selector'}
                      {triggerType === 'custom_event' && 'Event Name'}
                    </Label>
                    <Input
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      placeholder={
                        triggerType === 'url_match'
                          ? '/thank-you'
                          : triggerType === 'css_selector'
                          ? '.add-to-cart'
                          : 'Enter value...'
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Deduplication</Label>
                      <p className="text-sm text-muted-foreground">
                        Match event_id with browser events
                      </p>
                    </div>
                    <Switch
                      checked={dedupeEnabled}
                      onCheckedChange={setDedupeEnabled}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !eventName || !triggerValue}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingMapping ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-lg">No event mappings yet</h3>
            <p className="text-sm max-w-sm mx-auto mt-1">
              Create mappings to automatically fire Facebook events when users 
              take actions on your website.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Fires (24h)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{mapping.eventName}</Badge>
                      {mapping.isStandardEvent && (
                        <Badge variant="outline" className="text-xs">Standard</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.triggerType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[200px] truncate">
                    {mapping.triggerValue}
                  </TableCell>
                  <TableCell>{mapping.fires24h || 0}</TableCell>
                  <TableCell>
                    <Switch
                      checked={mapping.isActive}
                      onCheckedChange={() => handleToggle(mapping)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(mapping)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
