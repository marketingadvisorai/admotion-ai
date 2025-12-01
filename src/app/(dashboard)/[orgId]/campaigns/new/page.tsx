'use client';

import { createCampaign } from '@/modules/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionState } from 'react';

const initialState = {
    error: '',
};

export default function NewCampaignPage({ params }: { params: { orgId: string } }) {
    const createCampaignWithOrg = createCampaign.bind(null, params.orgId);
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createCampaignWithOrg(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return { error: '' };
    }, initialState);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Campaign</CardTitle>
                    <CardDescription>
                        Tell us about your product and goal to generate video ads.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input id="name" name="name" placeholder="Summer Sale 2025" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <Select name="platform" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="instagram_reels">Instagram Reels</SelectItem>
                                    <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brief">Campaign Brief</Label>
                            <Textarea
                                id="brief"
                                name="brief"
                                placeholder="Describe your product, target audience, and key message..."
                                className="min-h-[150px]"
                                required
                            />
                        </div>

                        {state?.error && (
                            <p className="text-sm text-red-500">{state.error}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
