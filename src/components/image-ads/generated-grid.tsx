import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, MoreHorizontal, MessageSquare } from 'lucide-react';

export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    style?: string;
    createdAt: Date;
    sessionId?: string; // Chat session that created this image
}

interface GeneratedGridProps {
    images: GeneratedImage[];
    isLoading: boolean;
    /** Callback when an image is clicked - receives the image and optionally loads its chat session */
    onImageClick?: (image: GeneratedImage) => void;
    /** Whether to show the session indicator on images */
    showSessionIndicator?: boolean;
}

export function GeneratedGrid({ images, isLoading, onImageClick, showSessionIndicator = false }: GeneratedGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-muted/50 border border-muted" />
                ))}
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Maximize2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No images generated yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Enter a prompt and select a style above to start creating amazing ad visuals.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
                <div 
                    key={image.id} 
                    className={`group relative aspect-square rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-300 ${onImageClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onImageClick?.(image)}
                >
                    {/* Image Placeholder or Actual Image */}
                    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        {image.url ? (
                            <Image
                                src={image.url}
                                alt={image.prompt}
                                fill
                                className="object-cover"
                                sizes="(min-width: 1024px) 300px, 50vw"
                            />
                        ) : (
                            <span className="text-xs text-muted-foreground p-4 text-center">{image.prompt}</span>
                        )}
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="rounded-full hover:scale-110 transition-transform"
                            onClick={(e) => { e.stopPropagation(); onImageClick?.(image); }}
                        >
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="rounded-full hover:scale-110 transition-transform"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="rounded-full hover:scale-110 transition-transform"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Session indicator - shows if image has associated chat */}
                    {showSessionIndicator && image.sessionId && (
                        <div className="absolute top-3 right-3 p-1.5 bg-purple-600/90 backdrop-blur-md rounded-full">
                            <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                    )}

                    {/* Badge */}
                    {image.style && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-medium text-white uppercase tracking-wider">
                            {image.style}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
