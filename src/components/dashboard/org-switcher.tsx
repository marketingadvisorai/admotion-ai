'use client';

import * as React from 'react';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrganizationMembership } from '@/modules/auth/types';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface OrgSwitcherProps {
    memberships: OrganizationMembership[];
}

export function OrgSwitcher({ memberships }: OrgSwitcherProps) {
    const router = useRouter();
    const params = useParams();
    const currentOrgId = params.orgId as string;

    const currentOrg = memberships.find((m) => m.org_id === currentOrgId)?.organization;
    // Fallback to first org if current not found (e.g. invalid ID) or just show "Select"
    const displayOrg = currentOrg || memberships[0]?.organization;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Select a workspace"
                    className="w-full justify-between"
                >
                    <span className="truncate">{displayOrg?.name || 'Select Workspace'}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                {memberships.map((membership) => (
                    <DropdownMenuItem
                        key={membership.org_id}
                        onSelect={() => {
                            router.push(`/dashboard/${membership.org_id}`);
                        }}
                        className="cursor-pointer"
                    >
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                currentOrgId === membership.org_id ? "opacity-100" : "opacity-0"
                            )}
                        />
                        <span className="truncate">{membership.organization?.name}</span>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/onboarding" className="cursor-pointer flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workspace
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
