import { getCurrentUser, getUserOrganizations } from '@/modules/auth/service';
import { redirect } from 'next/navigation';
import { signOut } from '@/modules/auth/actions';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const orgs = await getUserOrganizations(user.id);

    if (orgs.length === 0) {
        redirect('/onboarding');
    }

    return (
        <DashboardShell user={user} orgs={orgs} signOutAction={signOut}>
            {children}
        </DashboardShell>
    );
}
