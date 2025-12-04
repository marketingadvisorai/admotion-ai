'use client';

import React, { useState } from 'react';
import { PromptInput } from './prompt-input';
import { StyleSelector, ImageStyle } from './style-selector';
import { GeneratedGrid, GeneratedImage } from './generated-grid';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('auto');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);

        // Mock AI generation delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock new images
        const newImages: GeneratedImage[] = Array.from({ length: 3 }).map((_, i) => ({
            id: Date.now().toString() + i,
            url: '', // Placeholder for now, would be real URL in production
            prompt: prompt,
            style: selectedStyle,
            createdAt: new Date(),
        }));

        setGeneratedImages((prev) => [...newImages, ...prev]);
        setIsGenerating(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-muted/40 shadow-sm space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            Create Ad Image
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Describe your vision and let AI handle the rest.
                        </p>
                    </div>

                    <PromptInput
                        value={prompt}
                        onChange={setPrompt}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                    />

                    <div className="h-px bg-border" />

                    <StyleSelector
                        selectedStyle={selectedStyle}
                        onSelect={setSelectedStyle}
                    />
                </Card>
            </div>

            {/* Right Panel: Results */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Results</h3>
                    <span className="text-sm text-muted-foreground">
                        {generatedImages.length} images created
                    </span>
                </div>

                <GeneratedGrid
                    images={generatedImages}
                    isLoading={isGenerating}
                />
            </div>
        </div>
    );
}
