import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type ImageStyle = 'auto' | 'clean_modern' | 'bold' | 'minimalist' | 'luxury' | 'playful' | 'natural';

interface StyleSelectorProps {
    selectedStyle: ImageStyle;
    onSelect: (style: ImageStyle) => void;
}

const styles: { id: ImageStyle; label: string; color: string }[] = [
    { id: 'auto', label: 'Auto', color: 'bg-gradient-to-br from-gray-100 to-gray-200' },
    { id: 'clean_modern', label: 'Clean & Modern', color: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
    { id: 'bold', label: 'Bold', color: 'bg-gradient-to-br from-orange-100 to-red-100' },
    { id: 'minimalist', label: 'Minimalist', color: 'bg-gradient-to-br from-gray-50 to-white border' },
    { id: 'luxury', label: 'Luxury', color: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white' },
    { id: 'playful', label: 'Playful', color: 'bg-gradient-to-br from-pink-100 to-purple-100' },
    { id: 'natural', label: 'Natural', color: 'bg-gradient-to-br from-green-50 to-emerald-50' },
];

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Choose Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => onSelect(style.id)}
                        className={cn(
                            "relative group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border-2",
                            selectedStyle === style.id
                                ? "border-violet-600 ring-2 ring-violet-100 scale-105"
                                : "border-transparent hover:border-gray-200 hover:scale-105",
                            style.color
                        )}
                    >
                        <span className={cn(
                            "text-sm font-medium",
                            style.id === 'luxury' ? "text-white" : "text-gray-900"
                        )}>
                            {style.label}
                        </span>

                        {selectedStyle === style.id && (
                            <div className="absolute -top-2 -right-2 bg-violet-600 text-white rounded-full p-0.5 shadow-md">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
