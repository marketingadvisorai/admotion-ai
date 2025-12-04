'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollText, Target, MapPin, Layers, Megaphone, Lightbulb } from 'lucide-react';
import { BrandKit } from '@/modules/brand-kits/types';

interface BrandKnowledgeBaseProps {
    brandKit: BrandKit | any; // Accept BrandKit or the raw analysis result
}

export function BrandKnowledgeBase({ brandKit }: BrandKnowledgeBaseProps) {
    const strategy = brandKit.strategy || {};
    const locations = brandKit.locations || [];
    const offerings = brandKit.offerings || [];
    const socialLinks = brandKit.social_links || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{brandKit.business_name}</h2>
                <p className="text-lg text-gray-500 max-w-2xl">{brandKit.description}</p>
                {brandKit.website_url && (
                    <a
                        href={brandKit.website_url.startsWith('http') ? brandKit.website_url : `https://${brandKit.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                        Visit Website
                    </a>
                )}
            </div>

            <Separator />

            {/* Strategy Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-indigo-50/50 to-white/30 border-indigo-100/50">
                    <div className="flex items-center gap-2 text-indigo-700 mb-4 font-semibold text-lg">
                        <Lightbulb className="h-5 w-5" />
                        Vision & Mission
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-xs text-indigo-900/70 uppercase tracking-wider mb-2">Vision</h4>
                            <p className="text-gray-700 italic font-light leading-relaxed">"{strategy.vision || 'Not defined'}"</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xs text-indigo-900/70 uppercase tracking-wider mb-2">Mission</h4>
                            <p className="text-gray-700 font-light leading-relaxed">"{strategy.mission || 'Not defined'}"</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-purple-50/50 to-white/30 border-purple-100/50">
                    <div className="flex items-center gap-2 text-purple-700 mb-4 font-semibold text-lg">
                        <Target className="h-5 w-5" />
                        Target Audience
                    </div>
                    <div className="space-y-4">
                        <p className="text-gray-700 font-light leading-relaxed">{strategy.target_audience || 'Not defined'}</p>
                        <div className="mt-4">
                            <h4 className="font-semibold text-xs text-purple-900/70 uppercase tracking-wider mb-2">Brand Voice</h4>
                            <Badge variant="secondary" className="bg-purple-100/50 text-purple-700 hover:bg-purple-200/50 backdrop-blur-sm border border-purple-200/50">
                                {strategy.brand_voice || 'Not defined'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values & Differentiators */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-gray-400" />
                        Core Values
                    </h3>
                    <div className="grid gap-3">
                        {strategy.values?.length > 0 ? (
                            strategy.values.map((value: string, i: number) => (
                                <div key={i} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <span className="font-medium text-gray-900">{value}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No values defined.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-gray-400" />
                        Key Differentiators
                    </h3>
                    <div className="grid gap-3">
                        {strategy.key_differentiators?.length > 0 ? (
                            strategy.key_differentiators.map((diff: string, i: number) => (
                                <div key={i} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                    <span className="font-medium text-gray-900">{diff}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No differentiators defined.</p>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Marketing Strategy Deep Dive */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                    <Target className="h-5 w-5 text-red-500" />
                    Marketing Strategy
                </h3>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="glass-panel rounded-3xl p-6 bg-red-50/30 border-red-100/50 hover:shadow-lg transition-shadow">
                        <h4 className="text-base font-semibold text-red-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            Pain Points
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {strategy.pain_points?.map((point: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span className="font-light">{point}</span>
                                </li>
                            )) || <li className="text-gray-400 italic">No pain points identified</li>}
                        </ul>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 bg-green-50/30 border-green-100/50 hover:shadow-lg transition-shadow">
                        <h4 className="text-base font-semibold text-green-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Key Benefits
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {strategy.key_benefits?.map((benefit: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">•</span>
                                    <span className="font-light">{benefit}</span>
                                </li>
                            )) || <li className="text-gray-400 italic">No benefits identified</li>}
                        </ul>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 bg-amber-50/30 border-amber-100/50 hover:shadow-lg transition-shadow">
                        <h4 className="text-base font-semibold text-amber-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            Marketing Angles
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {strategy.marketing_angles?.map((angle: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="font-light">{angle}</span>
                                </li>
                            )) || <li className="text-gray-400 italic">No hooks identified</li>}
                        </ul>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Audience & Content */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="h-5 w-5 text-gray-400" />
                        Audience Deep Dive
                    </h3>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-1">Target Audience</h4>
                                    <p className="text-gray-900">{strategy.target_audience || 'Not defined'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-1">Demographics & Persona</h4>
                                    <p className="text-gray-900">{strategy.customer_demographics || 'Not defined'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-1">Industry Context</h4>
                                    <Badge variant="outline">{strategy.industry || 'General'}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-gray-400" />
                        Content Strategy Ideas
                    </h3>
                    <div className="grid gap-3">
                        {strategy.content_ideas?.length > 0 ? (
                            strategy.content_ideas.map((idea: string, i: number) => (
                                <div key={i} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                                    <span className="font-medium text-gray-900">{idea}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No content ideas generated.</p>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Offerings & Locations */}
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="h-5 w-5 text-gray-400" />
                        Offerings
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {offerings.length > 0 ? (
                            offerings.map((o: any, i: number) => (
                                <div key={i} className="flex flex-col p-4 bg-gray-50 rounded-lg border">
                                    <span className="font-bold text-gray-900">{o.name}</span>
                                    <span className="text-gray-600 text-sm mt-1">{o.description}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No offerings listed.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        Locations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {locations.length > 0 ? (
                            locations.map((loc: string, i: number) => (
                                <Badge key={i} variant="outline" className="px-3 py-1">
                                    {loc}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No locations listed.</p>
                        )}
                    </div>

                    <div className="pt-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Social Presence</h3>
                        <div className="space-y-2">
                            {Object.entries(socialLinks).map(([platform, link]) => (
                                <a
                                    key={platform}
                                    href={link as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-indigo-600 hover:underline capitalize"
                                >
                                    {platform}
                                </a>
                            ))}
                            {Object.keys(socialLinks).length === 0 && (
                                <p className="text-gray-500 italic text-sm">No social links.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
