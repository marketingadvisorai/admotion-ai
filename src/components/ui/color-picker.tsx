'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pipette, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    className?: string;
}

export function ColorPicker({ color, onChange, label, className }: ColorPickerProps) {
    const [localColor, setLocalColor] = useState(color);

    useEffect(() => {
        setLocalColor(color);
    }, [color]);

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        onChange(newColor);
    };

    const openEyeDropper = async () => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }

        const eyeDropper = new window.EyeDropper();
        try {
            const result = await eyeDropper.open();
            handleColorChange(result.sRGBHex);
        } catch (e) {
            console.log('User canceled the eye dropper');
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</Label>}
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-10 h-10 p-0 rounded-full border-2 shadow-sm shrink-0"
                            style={{ backgroundColor: localColor }}
                        >
                            <span className="sr-only">Pick a color</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <Label>Custom Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={localColor}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        className="h-8 font-mono"
                                    />
                                    <input
                                        type="color"
                                        value={localColor}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={openEyeDropper}
                            >
                                <Pipette className="w-3 h-3 mr-2" />
                                Pick from Screen
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex-1 relative">
                    <Input
                        value={localColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="font-mono uppercase"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={openEyeDropper}
                    title="Pick color from screen"
                >
                    <Pipette className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// Add type definition for EyeDropper API
declare global {
    interface Window {
        EyeDropper: new () => {
            open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
        };
    }
}
