'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
    Brain, 
    Shield, 
    AlertTriangle, 
    Check, 
    Plus, 
    X, 
    Sparkles,
    RefreshCw,
    History,
    Save,
    Eye
} from 'lucide-react';
import { BrandMemory, StyleTokens, VoiceRules } from '@/modules/creative-studio/types';

interface BrandMemoryPanelProps {
    orgId: string;
    brandMemory: BrandMemory | null;
    onSave: (updates: Partial<BrandMemory>) => Promise<void>;
    onSync: () => Promise<void>;
    isSyncing?: boolean;
}

export function BrandMemoryPanel({ 
    orgId, 
    brandMemory, 
    onSave, 
    onSync,
    isSyncing = false 
}: BrandMemoryPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Editable fields
    const [layoutStyle, setLayoutStyle] = useState(brandMemory?.layout_style || 'modern');
    const [logoPlacement, setLogoPlacement] = useState(brandMemory?.logo_placement || 'bottom-right');
    const [styleVibe, setStyleVibe] = useState(brandMemory?.style_tokens?.vibe || '');
    const [styleMood, setStyleMood] = useState(brandMemory?.style_tokens?.mood || '');
    const [voiceTone, setVoiceTone] = useState(brandMemory?.voice_rules?.tone || '');
    const [doList, setDoList] = useState<string[]>(brandMemory?.do_list || []);
    const [dontList, setDontList] = useState<string[]>(brandMemory?.dont_list || []);
    const [complianceRules, setComplianceRules] = useState<string[]>(brandMemory?.compliance_rules || []);
    
    const [newDoItem, setNewDoItem] = useState('');
    const [newDontItem, setNewDontItem] = useState('');
    const [newComplianceRule, setNewComplianceRule] = useState('');

    useEffect(() => {
        if (brandMemory) {
            setLayoutStyle(brandMemory.layout_style || 'modern');
            setLogoPlacement(brandMemory.logo_placement || 'bottom-right');
            setStyleVibe(brandMemory.style_tokens?.vibe || '');
            setStyleMood(brandMemory.style_tokens?.mood || '');
            setVoiceTone(brandMemory.voice_rules?.tone || '');
            setDoList(brandMemory.do_list || []);
            setDontList(brandMemory.dont_list || []);
            setComplianceRules(brandMemory.compliance_rules || []);
        }
    }, [brandMemory]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                layout_style: layoutStyle as BrandMemory['layout_style'],
                logo_placement: logoPlacement as BrandMemory['logo_placement'],
                style_tokens: { vibe: styleVibe, mood: styleMood },
                voice_rules: { tone: voiceTone },
                do_list: doList,
                dont_list: dontList,
                compliance_rules: complianceRules,
            });
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const addToList = (list: string[], setList: (l: string[]) => void, item: string, clearInput: () => void) => {
        if (item.trim() && !list.includes(item.trim())) {
            setList([...list, item.trim()]);
            clearInput();
        }
    };

    const removeFromList = (list: string[], setList: (l: string[]) => void, index: number) => {
        setList(list.filter((_, i) => i !== index));
    };

    if (!brandMemory) {
        return (
            <div className="text-center py-16 space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">No Brand Memory Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Sync from your brand kit to create AI-powered brand memory for consistent ad generation.
                    </p>
                </div>
                <Button 
                    onClick={onSync} 
                    disabled={isSyncing}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                >
                    {isSyncing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Create Brand Memory
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Brand Memory</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline" className="text-xs">
                                <History className="w-3 h-3 mr-1" />
                                Version {brandMemory.version}
                            </Badge>
                            <span>•</span>
                            <span>{brandMemory.brand_name || 'Unnamed Brand'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync from Kit
                    </Button>
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                            Edit Memory
                        </Button>
                    )}
                </div>
            </div>

            {/* Layout & Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-indigo-500" />
                        Visual Style
                    </h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Layout Style</label>
                            {isEditing ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['modern', 'minimal', 'bold', 'ugc', 'premium'].map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setLayoutStyle(style as BrandMemory['layout_style'])}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                layoutStyle === style
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-1 text-gray-900 capitalize">{layoutStyle}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Logo Placement</label>
                            {isEditing ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => setLogoPlacement(pos as BrandMemory['logo_placement'])}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                logoPlacement === pos
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-1 text-gray-900 capitalize">{logoPlacement.replace('-', ' ')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Style Tokens
                    </h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vibe</label>
                            {isEditing ? (
                                <Input
                                    value={styleVibe}
                                    onChange={(e) => setStyleVibe(e.target.value)}
                                    placeholder="e.g., professional, playful, bold, elegant"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="mt-1 text-gray-900">{styleVibe || 'Not set'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</label>
                            {isEditing ? (
                                <Input
                                    value={styleMood}
                                    onChange={(e) => setStyleMood(e.target.value)}
                                    placeholder="e.g., energetic, calm, luxurious, friendly"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="mt-1 text-gray-900">{styleMood || 'Not set'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Voice Tone</label>
                            {isEditing ? (
                                <Input
                                    value={voiceTone}
                                    onChange={(e) => setVoiceTone(e.target.value)}
                                    placeholder="e.g., conversational, formal, witty"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="mt-1 text-gray-900">{voiceTone || 'Not set'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Do's and Don'ts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Do List */}
                <div className="space-y-4 p-5 bg-green-50/50 rounded-2xl border border-green-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Do&apos;s (Approved)
                    </h4>
                    
                    {isEditing && (
                        <div className="flex gap-2">
                            <Input
                                value={newDoItem}
                                onChange={(e) => setNewDoItem(e.target.value)}
                                placeholder="Add approved phrase or theme..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addToList(doList, setDoList, newDoItem, () => setNewDoItem(''));
                                    }
                                }}
                            />
                            <Button 
                                size="icon" 
                                variant="outline"
                                onClick={() => addToList(doList, setDoList, newDoItem, () => setNewDoItem(''))}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                        {doList.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No approved phrases added</p>
                        ) : (
                            doList.map((item, i) => (
                                <Badge key={i} variant="secondary" className="bg-green-100 text-green-700 gap-1">
                                    {item}
                                    {isEditing && (
                                        <button onClick={() => removeFromList(doList, setDoList, i)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>

                {/* Don't List */}
                <div className="space-y-4 p-5 bg-red-50/50 rounded-2xl border border-red-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        Don&apos;ts (Banned)
                    </h4>
                    
                    {isEditing && (
                        <div className="flex gap-2">
                            <Input
                                value={newDontItem}
                                onChange={(e) => setNewDontItem(e.target.value)}
                                placeholder="Add banned word or visual..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addToList(dontList, setDontList, newDontItem, () => setNewDontItem(''));
                                    }
                                }}
                            />
                            <Button 
                                size="icon" 
                                variant="outline"
                                onClick={() => addToList(dontList, setDontList, newDontItem, () => setNewDontItem(''))}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                        {dontList.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No banned words added</p>
                        ) : (
                            dontList.map((item, i) => (
                                <Badge key={i} variant="secondary" className="bg-red-100 text-red-700 gap-1">
                                    {item}
                                    {isEditing && (
                                        <button onClick={() => removeFromList(dontList, setDontList, i)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Compliance Rules */}
            <div className="space-y-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Compliance Rules
                </h4>
                
                {isEditing && (
                    <div className="flex gap-2">
                        <Input
                            value={newComplianceRule}
                            onChange={(e) => setNewComplianceRule(e.target.value)}
                            placeholder="Add compliance rule or claim restriction..."
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addToList(complianceRules, setComplianceRules, newComplianceRule, () => setNewComplianceRule(''));
                                }
                            }}
                        />
                        <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => addToList(complianceRules, setComplianceRules, newComplianceRule, () => setNewComplianceRule(''))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                
                <div className="space-y-2">
                    {complianceRules.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No compliance rules added</p>
                    ) : (
                        complianceRules.map((rule, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 flex-1">{rule}</span>
                                {isEditing && (
                                    <button 
                                        onClick={() => removeFromList(complianceRules, setComplianceRules, i)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
