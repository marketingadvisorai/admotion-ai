'use client';

import { createOrganization } from '@/modules/organizations/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionState } from 'react';

const initialState = {
    error: '',
};

export default function OnboardingPage() {
    const [state, formAction, isPending] = useActionState(async (_prevState: typeof initialState, formData: FormData) => {
        const result = await createOrganization(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return { error: '' };
    }, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to AdFlow AI</CardTitle>
                    <CardDescription>
                        Let's create your first workspace to get started.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input id="name" name="name" placeholder="Acme Agency" required />
                            <p className="text-xs text-gray-500">This will be your unique identifier.</p>
                        </div>
                        {state?.error && (
                            <p className="text-sm text-red-500">{state.error}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating Workspace...' : 'Create Workspace'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
