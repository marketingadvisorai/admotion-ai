'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { OrgSwitcher } from './org-switcher';
import { OrganizationMembership } from '@/modules/auth/types';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';
import {
    House,
    Images,
    Clapperboard,
    Palette,
    Settings,
    Sparkles,
    FolderOpen,
    X,
    ChevronRight,
    Plug,
    LogOut,
    PanelLeftClose,
    Target,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SidebarProps {
    user: User;
    orgs: OrganizationMembership[];
    signOutAction: () => Promise<void>;
    isOpen: boolean;
    isMobile: boolean;
    onClose: () => void;
}

export function Sidebar({ user, orgs, signOutAction, isOpen, isMobile, onClose }: SidebarProps) {
    const pathname = usePathname();
    const params = useParams();
    const orgId = (params.orgId as string) || orgs[0]?.org_id;
    const activeOrgName = orgs.find((org) => org.org_id === orgId)?.organization?.name || orgs[0]?.organization?.name;

    const links = [
        { href: `/dashboard/${orgId}`, label: 'Home', icon: House, exact: true },
        { href: `/dashboard/${orgId}/brand-kits`, label: 'Brand', icon: Palette },
        { href: `/dashboard/${orgId}/brand-optimizer`, label: 'Optimize', icon: Sparkles },
        { href: `/dashboard/${orgId}/image-ads`, label: 'Image', icon: Images },
        { href: `/dashboard/${orgId}/video-ads`, label: 'Video', icon: Clapperboard },
        { href: `/dashboard/${orgId}/tracking-ai`, label: 'Tracking', icon: Target },
        { href: `/dashboard/${orgId}/assets`, label: 'Assets', icon: FolderOpen },
        { href: `/dashboard/${orgId}/integrations`, label: 'Integrations', icon: Plug },
        { href: `/dashboard/${orgId}/settings`, label: 'Settings', icon: Settings },
    ];

    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                    aria-hidden
                />
            )}
            <aside
                className={cn(
                    'fixed md:static inset-y-0 left-0 z-40 flex flex-col border-r shadow-xl md:shadow-none transition-all duration-300 ease-out',
                    'bg-white/70 border-white/70 backdrop-blur-xl',
                    isMobile
                        ? isOpen
                            ? 'w-72 translate-x-0'
                            : 'w-72 -translate-x-full'
                        : isOpen
                            ? 'w-64 translate-x-0'
                            : 'w-16 translate-x-0'
                )}
            >
                <div className={cn('relative flex items-center justify-between px-4 pt-5 pb-4', !isOpen && 'justify-center')}>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2"
                        onClick={(e) => {
                            if (!isOpen) {
                                e.preventDefault();
                                window.dispatchEvent(new Event('admotion:sidebar-open'));
                            }
                        }}
                    >
                        <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-semibold tracking-tight">
                            V
                        </div>
                        {isOpen && <span className="text-sm font-bold text-slate-900">AdFlow</span>}
                    </Link>
                    {!isMobile && isOpen && (
                        <div className="group relative">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition hover:shadow-md"
                                onClick={onClose}
                                aria-label="Close sidebar"
                                title="Close sidebar"
                            >
                                <PanelLeftClose className="size-4" />
                            </Button>
                            <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                Close sidebar
                            </span>
                        </div>
                    )}
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full border border-slate-200"
                            onClick={onClose}
                            aria-label="Close navigation"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>

                    {isOpen && (
                        <div className="px-4 md:px-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:border-white transition"
                                        aria-label="Switch workspace"
                                    >
                                        <span className="line-clamp-1 text-left">{activeOrgName || 'Select workspace'}</span>
                                        <ChevronRight className="size-4 text-slate-400" />
                                    </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" side="right" className="w-72 p-4 shadow-lg">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Workspace
                                </p>
                                <OrgSwitcher memberships={orgs} />
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                <nav className="mt-4 flex-1 space-y-2 px-2">
                    {links.map((link) => {
                        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={link.label}
                                onClick={isMobile ? onClose : undefined}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px]',
                                    isActive
                                        ? 'bg-slate-900/95 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]'
                                        : 'text-slate-600 hover:bg-white/85 hover:text-slate-900 hover:shadow-[0_16px_38px_-28px_rgba(15,23,42,0.28)]',
                                    !isOpen && 'justify-center'
                                )}
                            >
                                <Icon className="size-5" />
                                {isOpen && <span className="text-sm">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={cn('mt-auto border-t border-white/70 px-4 py-4', !isOpen && 'flex flex-col items-center gap-3')}>
                    {isOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                                {user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                    {user.user_metadata.full_name || 'User'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <form action={signOutAction} className="mt-3 w-full">
                        <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className={cn('w-full justify-center gap-2 rounded-lg border-slate-200', !isOpen && 'px-0')}
                        >
                            <LogOut className="size-4" />
                            {isOpen && 'Sign out'}
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    );
}
