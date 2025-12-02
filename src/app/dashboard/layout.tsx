import { getCurrentUser, getUserOrganizations } from '@/modules/auth/service';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/modules/auth/actions';
import { Sidebar } from '@/components/dashboard/sidebar';

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
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar user={user} orgs={orgs} signOutAction={signOut} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
