'use client';

/**
 * Facebook Pixel Selector Component
 * Displays available pixels and allows selection
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { FacebookPixel } from '@/modules/tracking-ai/providers/facebook/types';

interface PixelSelectorProps {
  orgId: string;
  pixels: FacebookPixel[];
  selectedPixelId?: string;
  onSelect: (pixelId: string) => void;
}

export function FacebookPixelSelector({
  orgId,
  pixels,
  selectedPixelId,
  onSelect,
}: PixelSelectorProps) {
  const [selecting, setSelecting] = useState(false);
  const [selectedValue, setSelectedValue] = useState(selectedPixelId || '');
  
  const handleSelect = async () => {
    if (!selectedValue) return;
    
    setSelecting(true);
    try {
      const response = await fetch('/api/tracking-ai/facebook/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, pixelId: selectedValue }),
      });
      
      if (response.ok) {
        onSelect(selectedValue);
      }
    } catch (error) {
      console.error('Failed to select pixel:', error);
    } finally {
      setSelecting(false);
    }
  };
  
  if (pixels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No pixels found</p>
        <p className="text-sm">
          Create a pixel in Facebook Events Manager first
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedValue}
        onValueChange={setSelectedValue}
        className="space-y-3"
      >
        {pixels.map((pixel) => {
          const isSelected = pixel.id === selectedPixelId;
          const lastFired = pixel.lastFiredTime
            ? new Date(pixel.lastFiredTime).toLocaleDateString()
            : 'Never';
          
          return (
            <div
              key={pixel.id}
              className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 ${
                selectedValue === pixel.id ? 'border-blue-600 bg-blue-50/50' : ''
              }`}
              onClick={() => setSelectedValue(pixel.id)}
            >
              <RadioGroupItem value={pixel.id} id={pixel.id} className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor={pixel.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="font-medium">{pixel.name}</span>
                  {isSelected && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {pixel.isUnavailable && (
                    <Badge variant="destructive">Unavailable</Badge>
                  )}
                </Label>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>ID: {pixel.id}</span>
                  <span className="mx-2">•</span>
                  <span>Last fired: {lastFired}</span>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
      
      {selectedValue !== selectedPixelId && (
        <Button
          onClick={handleSelect}
          disabled={selecting || !selectedValue}
          className="w-full"
        >
          {selecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Selecting...
            </>
          ) : (
            'Select Pixel'
          )}
        </Button>
      )}
    </div>
  );
}
