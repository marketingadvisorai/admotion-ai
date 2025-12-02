import { createClient } from '@/lib/db/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import InviteMemberDialog from '@/components/settings/invite-member-dialog';
import InvitationList from '@/components/settings/invitation-list';
import { getInvitations } from '@/modules/invitations/service';
import { getCurrentUser, checkOrgAccess } from '@/modules/auth/service';
import { redirect } from 'next/navigation';

async function getOrgDetails(orgId: string) {
    const supabase = await createClient();

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

    const { data: members } = await supabase
        .from('organization_memberships')
        .select('*, user:profiles(*)')
        .eq('org_id', orgId);

    return { org, members };
}

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const userRole = await checkOrgAccess(user.id, orgId);
    const { org, members } = await getOrgDetails(orgId);
    const invitations = await getInvitations(orgId);

    const canManageTeam = userRole === 'owner' || userRole === 'admin';

    return (
        <div className="p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your workspace settings and team members.</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Details</CardTitle>
                        <CardDescription>General information about your workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Name</label>
                                <p className="mt-1 text-sm text-gray-900">{org?.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Slug</label>
                                <p className="mt-1 text-sm text-gray-900">{org?.slug}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Plan</label>
                                <p className="mt-1 text-sm text-gray-900 capitalize">{org?.billing_plan}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Credits Balance</label>
                                <p className="mt-1 text-sm text-gray-900">{org?.credits_balance}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Manage who has access to this workspace.</CardDescription>
                        </div>
                        {canManageTeam && <InviteMemberDialog orgId={orgId} />}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {members?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.user?.avatar_url} />
                                            <AvatarFallback>{member.user?.full_name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{member.user?.full_name || 'Unknown User'}</p>
                                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Joined {new Date(member.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <InvitationList invitations={invitations} orgId={orgId} canManage={canManageTeam} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
