import { getBrandKits } from '@/modules/brand-kits/service';
import { BrandKitsManager } from '@/components/brand-kits/brand-kits-manager';

export default async function BrandKitsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const brandKits = await getBrandKits(orgId);

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Ambient Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="flex-1 space-y-8 p-8 pt-6 relative z-10">
                <div className="flex items-center justify-between space-y-2">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            Brand Kits
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl font-light">
                            Manage your brand identities, colors, fonts, and assets in one place.
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-1 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl p-6 sm:p-8 rounded-[20px]">
                        <BrandKitsManager brandKits={brandKits} orgId={orgId} />
                    </div>
                </div>
            </div>
        </div>
    );
}
