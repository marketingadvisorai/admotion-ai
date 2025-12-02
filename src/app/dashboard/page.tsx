import { getCurrentUser, getUserOrganizations } from '@/modules/auth/service';
import { redirect } from 'next/navigation';

export default async function DashboardRootPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const orgs = await getUserOrganizations(user.id);
    if (orgs.length === 0) redirect('/onboarding');

    // Redirect to the first org
    redirect(`/dashboard/${orgs[0].org_id}`);
}
