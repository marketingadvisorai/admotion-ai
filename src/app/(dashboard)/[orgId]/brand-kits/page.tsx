import { getBrandKits } from '@/modules/brand-kits/service';
import BrandKitList from '@/components/brand-kits/brand-kit-list';
import CreateBrandKitDialog from '@/components/brand-kits/create-brand-kit-dialog';

export default async function BrandKitsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const brandKits = await getBrandKits(orgId);

    return (
        <div className="p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1>
                    <p className="text-gray-500">Manage your brand assets, colors, and fonts.</p>
                </div>
                <CreateBrandKitDialog orgId={orgId} />
            </div>

            <BrandKitList brandKits={brandKits} orgId={orgId} />
        </div>
    );
}
