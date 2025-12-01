'use client';

import { updateBrandKit } from '@/modules/brand/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionState } from 'react';
import { BrandKit } from '@/modules/brand/types';

const initialState = {
    error: '',
    success: false,
};

export default function BrandKitPage({
    params,
    brandKit
}: {
    params: { orgId: string },
    brandKit: BrandKit | null
}) {
    const updateBrandKitWithOrg = updateBrandKit.bind(null, params.orgId);
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await updateBrandKitWithOrg(formData);
        if (result?.error) {
            return { error: result.error, success: false };
        }
        return { error: '', success: true };
    }, initialState);

    return (
        <div className="p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Brand Kit</h1>
                <p className="text-gray-500">Manage your brand assets, colors, and fonts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Brand Assets</CardTitle>
                    <CardDescription>
                        These assets will be used to generate your video ads.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-6">
                        {state?.success && (
                            <div className="p-4 text-sm text-green-700 bg-green-100 rounded-md">
                                Brand kit updated successfully.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Brand Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={brandKit?.name || ''}
                                placeholder="My Brand"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                name="logoUrl"
                                defaultValue={brandKit?.logo_url || ''}
                                placeholder="https://example.com/logo.png"
                            />
                            <p className="text-xs text-gray-500">Upload support coming soon. Paste a URL for now.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primaryColor"
                                        name="primaryColor"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        defaultValue={brandKit?.colors?.primary || '#000000'}
                                    />
                                    <Input
                                        type="text"
                                        defaultValue={brandKit?.colors?.primary || '#000000'}
                                        readOnly
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryColor">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondaryColor"
                                        name="secondaryColor"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        defaultValue={brandKit?.colors?.secondary || '#ffffff'}
                                    />
                                    <Input
                                        type="text"
                                        defaultValue={brandKit?.colors?.secondary || '#ffffff'}
                                        readOnly
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="headingFont">Heading Font</Label>
                                <Input
                                    id="headingFont"
                                    name="headingFont"
                                    defaultValue={brandKit?.fonts?.heading || 'Inter'}
                                    placeholder="Inter"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bodyFont">Body Font</Label>
                                <Input
                                    id="bodyFont"
                                    name="bodyFont"
                                    defaultValue={brandKit?.fonts?.body || 'Inter'}
                                    placeholder="Inter"
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <p className="text-sm text-red-500">{state.error}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
