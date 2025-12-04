'use client';

import { useState } from 'react';
import { LlmProfile } from '@/modules/llm/types';
import { upsertLlmProfileAction, deleteLlmProfileAction } from '@/modules/llm/admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    profiles: LlmProfile[];
}

interface EditState {
    id?: string;
    slug: string;
    provider: string;
    model: string;
    system_prompt: string;
    temperature: string;
    max_tokens: string;
    is_active: boolean;
}

const DEFAULT_PROFILE: EditState = {
    slug: 'brand_analyzer',
    provider: 'openai',
    model: 'gpt-4o',
    system_prompt: '',
    temperature: '0.2',
    max_tokens: '700',
    is_active: true,
};

export function LlmProfilesSettings({ profiles }: Props) {
    const [editing, setEditing] = useState<EditState | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const openNew = () => {
        setEditing({ ...DEFAULT_PROFILE });
    };

    const openEdit = (profile: LlmProfile) => {
        setEditing({
            id: profile.id,
            slug: profile.slug,
            provider: profile.provider,
            model: profile.model,
            system_prompt: profile.system_prompt,
            temperature: String(profile.temperature ?? 0.2),
            max_tokens: String(profile.max_tokens ?? 700),
            is_active: profile.is_active,
        });
    };

    const handleSave = async () => {
        if (!editing) return;
        setIsSaving(true);
        try {
            const result = await upsertLlmProfileAction({
                id: editing.id,
                slug: editing.slug,
                provider: editing.provider,
                model: editing.model,
                system_prompt: editing.system_prompt,
                temperature: parseFloat(editing.temperature || '0.2'),
                max_tokens: parseInt(editing.max_tokens || '700', 10),
                is_active: editing.is_active,
            });

            if (!result.success) {
                toast.error(result.error || 'Failed to save profile');
            } else {
                toast.success('Profile saved');
                setEditing(null);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this profile? This cannot be undone.')) return;
        const result = await deleteLlmProfileAction(id);
        if (!result.success) {
            toast.error(result.error || 'Failed to delete profile');
        } else {
            toast.success('Profile deleted');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        LLM Profiles
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Configure prompts and models for internal agents like the Brand Analyzer.
                    </p>
                </div>
                <Button size="sm" onClick={openNew}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Profile
                </Button>
            </div>

            <div className="grid gap-3">
                {profiles.map((profile) => (
                    <Card key={profile.id} className="border border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">{profile.slug}</CardTitle>
                                <CardDescription className="text-xs">
                                    {profile.provider} · {profile.model} · {profile.is_active ? 'Active' : 'Inactive'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEdit(profile)}>
                                    Edit
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(profile.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {profile.system_prompt}
                            </p>
                        </CardContent>
                    </Card>
                ))}
                {profiles.length === 0 && (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle className="text-sm">No profiles yet</CardTitle>
                            <CardDescription className="text-xs">
                                Start by creating a profile for <code>brand_analyzer</code> to control how website content is interpreted.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>

            <Dialog open={!!editing} onOpenChange={(open) => !open && !isSaving && setEditing(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing?.id ? 'Edit LLM Profile' : 'New LLM Profile'}</DialogTitle>
                        <DialogDescription>
                            Adjust the system prompt and model. Changes affect all tools that use this profile.
                        </DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Slug</label>
                                    <Input
                                        value={editing.slug}
                                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                                        disabled={!!editing.id}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Provider</label>
                                    <Input
                                        value={editing.provider}
                                        onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Model</label>
                                    <Input
                                        value={editing.model}
                                        onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                                        placeholder="gpt-4o"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Temperature</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={editing.temperature}
                                        onChange={(e) => setEditing({ ...editing, temperature: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Max Tokens</label>
                                    <Input
                                        type="number"
                                        value={editing.max_tokens}
                                        onChange={(e) => setEditing({ ...editing, max_tokens: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 flex items-center gap-2">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={editing.is_active}
                                        onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="is_active" className="text-xs font-medium">
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">System Prompt</label>
                                <Textarea
                                    value={editing.system_prompt}
                                    onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })}
                                    className="h-40 text-xs"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={handleSave}
                            disabled={!editing || !editing.slug || !editing.model || isSaving}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

