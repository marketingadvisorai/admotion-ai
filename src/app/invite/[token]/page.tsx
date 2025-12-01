import { getInvitationByToken } from '@/modules/invitations/service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCurrentUser } from '@/modules/auth/service';
import AcceptInviteForm from '@/components/invitations/accept-invite-form';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const invitation: any = await getInvitationByToken(token);
    const user = await getCurrentUser();

    if (!invitation || invitation.status !== 'pending') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation is invalid, expired, or has already been accepted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/login">
                            <Button className="w-full">Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Join {invitation.organization?.name}</CardTitle>
                    <CardDescription>
                        You have been invited to join <strong>{invitation.organization?.name}</strong> as a <strong>{invitation.role}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Logged in as</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>

                            <AcceptInviteForm token={token} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">You need to be logged in to accept this invitation.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href={`/login?next=/invite/${token}`}>
                                    <Button variant="outline" className="w-full">Login</Button>
                                </Link>
                                <Link href={`/signup?next=/invite/${token}`}>
                                    <Button className="w-full">Sign Up</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
