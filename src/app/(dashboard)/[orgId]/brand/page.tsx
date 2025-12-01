import { getBrandKit } from '@/modules/brand/service';
import BrandKitForm from '@/components/brand/brand-kit-form';

export default async function BrandPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const brandKit = await getBrandKit(orgId);

    return <BrandKitForm params={{ orgId }} brandKit={brandKit} />;
}
