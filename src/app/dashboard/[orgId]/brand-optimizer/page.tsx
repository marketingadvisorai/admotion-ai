import { getBrandKits } from '@/modules/brand-kits/actions';
import { BrandAnalyzerTool } from '@/components/brand-kits/brand-analyzer-tool';
import { Separator } from '@/components/ui/separator';
import { Sparkles } from 'lucide-react';

export default async function BrandOptimizerPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const { data: brandKits } = await getBrandKits(orgId);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-indigo-500" />
                        Brand Optimizer
                    </h2>
                    <p className="text-muted-foreground">
                        Train your Brand AI with deep marketing insights, pain points, and hooks to generate high-converting video ads.
                    </p>
                </div>
            </div>
            <Separator />

            <div className="grid gap-4">
                <BrandAnalyzerTool orgId={orgId} brandKits={brandKits || []} />
            </div>
        </div>
    );
}
