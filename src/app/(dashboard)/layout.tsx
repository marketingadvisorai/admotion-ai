import { getCurrentUser, getUserOrganizations } from '@/modules/auth/service';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/modules/auth/actions';

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
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                        AdFlow AI
                    </Link>
                </div>

                <div className="p-4">
                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Workspace
                        </label>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-medium">
                            {/* TODO: Org Switcher */}
                            {orgs[0].organization?.name}
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <Link href={`/dashboard/${orgs[0].org_id}`} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                            Campaigns
                        </Link>
                        <Link href={`/dashboard/${orgs[0].org_id}/brand`} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                            Brand Kit
                        </Link>
                        <Link href={`/dashboard/${orgs[0].org_id}/assets`} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                            Assets
                        </Link>
                        <Link href={`/dashboard/${orgs[0].org_id}/settings`} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                            Settings
                        </Link>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="text-sm overflow-hidden">
                            <p className="font-medium text-gray-900 truncate">{user.user_metadata.full_name || 'User'}</p>
                            <p className="text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <form action={signOut}>
                        <Button variant="outline" className="w-full justify-start" size="sm">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
