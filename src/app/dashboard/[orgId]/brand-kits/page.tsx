import { getBrandKits } from '@/modules/brand-kits/service';
import { BrandKitsManager } from '@/components/brand-kits/brand-kits-manager';

export default async function BrandKitsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const brandKits = await getBrandKits(orgId);

    return (
        <div className="p-8 max-w-6xl">
            <BrandKitsManager brandKits={brandKits} orgId={orgId} />
        </div>
    );
}
