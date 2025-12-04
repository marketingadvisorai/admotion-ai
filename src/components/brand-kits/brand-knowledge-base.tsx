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
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <Lightbulb className="h-5 w-5" />
                            Vision & Mission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm text-indigo-900 uppercase tracking-wider mb-1">Vision</h4>
                            <p className="text-gray-700 italic">"{strategy.vision || 'Not defined'}"</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-indigo-900 uppercase tracking-wider mb-1">Mission</h4>
                            <p className="text-gray-700">"{strategy.mission || 'Not defined'}"</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <Target className="h-5 w-5" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{strategy.target_audience || 'Not defined'}</p>
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm text-purple-900 uppercase tracking-wider mb-2">Brand Voice</h4>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                {strategy.brand_voice || 'Not defined'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
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
                    <Card className="bg-red-50 border-red-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-red-900">Pain Points</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {strategy.pain_points?.map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                )) || <li className="text-gray-400 italic">No pain points identified</li>}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-green-900">Key Benefits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {strategy.key_benefits?.map((benefit: string, i: number) => (
                                    <li key={i}>{benefit}</li>
                                )) || <li className="text-gray-400 italic">No benefits identified</li>}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-amber-900">Marketing Angles (Hooks)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {strategy.marketing_angles?.map((angle: string, i: number) => (
                                    <li key={i}>{angle}</li>
                                )) || <li className="text-gray-400 italic">No hooks identified</li>}
                            </ul>
                        </CardContent>
                    </Card>
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
