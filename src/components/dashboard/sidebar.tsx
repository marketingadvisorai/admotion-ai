'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { OrgSwitcher } from './org-switcher';
import { OrganizationMembership } from '@/modules/auth/types';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
    user: User;
    orgs: OrganizationMembership[];
    signOutAction: () => Promise<void>;
}

export function Sidebar({ user, orgs, signOutAction }: SidebarProps) {
    const pathname = usePathname();
    const params = useParams();
    const orgId = params.orgId as string || orgs[0]?.org_id;

    const links = [
        { href: `/dashboard/${orgId}`, label: 'Campaigns', exact: true },
        { href: `/dashboard/${orgId}/brand-kits`, label: 'Brand Kits' },
        { href: `/dashboard/${orgId}/assets`, label: 'Assets' },
        { href: `/dashboard/${orgId}/settings`, label: 'Settings' },
    ];

    return (
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
                    <div className="mt-1">
                        <OrgSwitcher memberships={orgs} />
                    </div>
                </div>

                <nav className="space-y-1">
                    {links.map((link) => {
                        const isActive = link.exact
                            ? pathname === link.href
                            : pathname.startsWith(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-sm font-medium",
                                    isActive
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
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
                <form action={signOutAction}>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                        Sign Out
                    </Button>
                </form>
            </div>
        </aside>
    );
}
