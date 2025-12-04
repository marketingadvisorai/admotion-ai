'use client';

import { updateBrandKit } from '@/modules/brand/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionState, useState } from 'react';
import { BrandKit } from '@/modules/brand/types';
import BrandAutofillPanel, { AutofillResult } from '@/components/brand/brand-autofill-panel';

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

    const [websiteUrl, setWebsiteUrl] = useState('');
    const [name, setName] = useState(brandKit?.name || '');
    const [logoUrl, setLogoUrl] = useState(brandKit?.logo_url || '');
    const [primaryColor, setPrimaryColor] = useState(brandKit?.colors?.primary || '#000000');
    const [secondaryColor, setSecondaryColor] = useState(brandKit?.colors?.secondary || '#ffffff');
    const [headingFont, setHeadingFont] = useState(brandKit?.fonts?.heading || 'Inter');
    const [bodyFont, setBodyFont] = useState(brandKit?.fonts?.body || 'Inter');
    const handleApplyAutofill = (data: AutofillResult) => {
        if (data.business_name) setName(data.business_name);
        if (data.logo_url) setLogoUrl(data.logo_url);

        const colorList: Array<{ value: string; type?: string }> = data.colors || [];
        const primary = colorList.find((c) => c.type === 'primary') || colorList[0];
        const secondary = colorList.find((c) => c.type === 'secondary') || colorList[1];
        if (primary?.value) setPrimaryColor(primary.value);
        if (secondary?.value) setSecondaryColor(secondary.value);

        if (data.fonts?.heading) setHeadingFont(data.fonts.heading);
        if (data.fonts?.body) setBodyFont(data.fonts.body);
    };

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
                        <BrandAutofillPanel
                            websiteUrl={websiteUrl}
                            onWebsiteUrlChange={setWebsiteUrl}
                            onApply={handleApplyAutofill}
                        />

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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Brand"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                name="logoUrl"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
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
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
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
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
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
                                    value={headingFont}
                                    onChange={(e) => setHeadingFont(e.target.value)}
                                    placeholder="Inter"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bodyFont">Body Font</Label>
                                <Input
                                    id="bodyFont"
                                    name="bodyFont"
                                    value={bodyFont}
                                    onChange={(e) => setBodyFont(e.target.value)}
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
