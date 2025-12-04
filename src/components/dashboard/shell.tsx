'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { OrganizationMembership } from '@/modules/auth/types';
import { User } from '@supabase/supabase-js';

interface DashboardShellProps {
  user: User;
  orgs: OrganizationMembership[];
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function DashboardShell({ user, orgs, signOutAction, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admotion:sidebar') : null;
    const defaultOpen = typeof window !== 'undefined' ? !window.matchMedia('(max-width: 1023px)').matches : true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(stored ? stored === 'open' : defaultOpen);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('admotion:sidebar', isSidebarOpen ? 'open' : 'closed');
  }, [hydrated, isSidebarOpen]);

  useEffect(() => {
    const openSidebar = () => setIsSidebarOpen(true);
    window.addEventListener('admotion:sidebar-open', openSidebar);
    return () => window.removeEventListener('admotion:sidebar-open', openSidebar);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        user={user}
        orgs={orgs}
        signOutAction={signOutAction}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 relative">
        {isSidebarOpen && !isMobile && (
          <div className="hidden md:flex fixed top-5 left-5 z-30">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Hide navigation"
            >
              <X className="size-5" />
            </Button>
          </div>
        )}

        <div className="sticky top-0 z-30 flex items-start justify-between gap-2 px-4 pt-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-slate-200 bg-white shadow-sm"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
          >
            {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        <main
          className={cn(
            'min-h-screen pb-12 px-4',
            isSidebarOpen && !isMobile ? 'md:pl-28 md:pr-8' : 'md:px-8'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
