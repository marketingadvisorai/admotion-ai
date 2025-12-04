'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBrandKitAction, updateBrandKitAction } from '@/modules/brand-kits/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Step1Discovery } from './steps/step-1-discovery';
import { Step3Identity } from './steps/step-3-identity';
import { Step2Analyzer } from './steps/step-2-analyzer';
import { Step4Preview } from './steps/step-4-preview';

const brandKitSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    // Relaxed URL validation to allow "domain.com" which we normalize later
    website_url: z.string().optional().or(z.literal('')),
    business_name: z.string().min(1, 'Business name is required'),
    description: z.string().optional(),
    locations: z.array(z.string()).optional(),
    colors: z.array(z.object({
        name: z.string(),
        value: z.string(),
        type: z.enum(['primary', 'secondary', 'accent'])
    })).optional(),
    fonts: z.object({
        heading: z.string(),
        body: z.string()
    }).optional(),
    social_links: z.record(z.string(), z.string()).optional(),
    logo_url: z.string().optional(),
    offerings: z.array(z.object({
        name: z.string(),
        description: z.string()
    })).optional(),
    strategy: z.object({
        vision: z.string().optional(),
        mission: z.string().optional(),
        values: z.array(z.string()).optional(),
        target_audience: z.string().optional(),
        brand_voice: z.string().optional(),
        key_differentiators: z.array(z.string()).optional()
    }).optional()
});

interface BrandKitWizardProps {
    orgId: string;
    existingKit?: any;
    onComplete?: () => void;
}

export function BrandKitWizard({ orgId, existingKit, onComplete }: BrandKitWizardProps) {
    const [step, setStep] = useState<'discovery' | 'identity' | 'analyzer' | 'preview'>('discovery');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(brandKitSchema),
        defaultValues: existingKit || {
            name: '',
            website_url: '',
            business_name: '',
            description: '',
            locations: [],
            colors: [],
            fonts: { heading: 'Inter', body: 'Inter' },
            social_links: {},
            logo_url: '',
            offerings: [],
            strategy: {
                vision: '',
                mission: '',
                values: [],
                target_audience: '',
                brand_voice: '',
                key_differentiators: []
            }
        }
    });

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            const payload = { ...data, org_id: orgId };
            let result;

            if (existingKit?.id) {
                result = await updateBrandKitAction(existingKit.id, payload);
            } else {
                result = await createBrandKitAction(payload);
            }

            if (result.success) {
                toast.success(existingKit ? 'Brand kit updated' : 'Brand kit created');
                if (onComplete) onComplete();
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to save brand kit');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <FormProvider {...form}>
            <div className="w-full max-w-4xl mx-auto">
                <Tabs value={step} onValueChange={(v: any) => setStep(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        <TabsTrigger value="discovery">1. Discovery</TabsTrigger>
                        <TabsTrigger value="identity" disabled={!form.watch('business_name')}>2. Identity</TabsTrigger>
                        <TabsTrigger value="analyzer" disabled={!form.watch('business_name')}>3. Brand Analyzer</TabsTrigger>
                        <TabsTrigger value="preview" disabled={!form.watch('business_name')}>4. Preview & Save</TabsTrigger>
                    </TabsList>

                    <TabsContent value="discovery">
                        <Step1Discovery
                            onNext={() => setStep('identity')}
                            orgId={orgId}
                        />
                    </TabsContent>

                    <TabsContent value="identity">
                        <Step3Identity
                            onBack={() => setStep('discovery')}
                            onNext={() => setStep('analyzer')}
                        />
                    </TabsContent>

                    <TabsContent value="analyzer">
                        <Step2Analyzer
                            onBack={() => setStep('identity')}
                            onNext={() => setStep('preview')}
                        />
                    </TabsContent>

                    <TabsContent value="preview">
                        <Step4Preview
                            onBack={() => setStep('analyzer')}
                            onSave={form.handleSubmit(onSubmit)}
                            isSaving={isSaving}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </FormProvider>
    );
}
