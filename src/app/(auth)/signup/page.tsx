'use client';

import { signup } from '@/modules/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useActionState } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

const initialState = {
    error: '',
    success: false,
    message: '',
};

export default function SignupPage() {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await signup(formData);
        if (result?.error) {
            return { ...prevState, error: result.error, success: false };
        }
        if (result?.success) {
            return { ...prevState, error: '', success: true, message: result.message };
        }
        return prevState;
    }, initialState);

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Create an account</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your information to get started
                        </p>
                    </div>
                    <form action={formAction} className="grid gap-4">
                        {state?.success ? (
                            <div className="p-4 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">
                                {state.message}
                                <div className="mt-4">
                                    <Link href="/login">
                                        <Button variant="outline" className="w-full">
                                            Go to Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="John Doe" required className="h-11" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required className="h-11" />
                                </div>
                                {state?.error && (
                                    <div className="text-sm text-red-500 font-medium flex items-center gap-2">
                                        <span className="block w-1 h-1 bg-red-500 rounded-full" />
                                        {state.error}
                                    </div>
                                )}
                                <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
                                    {isPending ? 'Creating account...' : 'Sign up'}
                                </Button>
                            </>
                        )}
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block relative overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900 text-white dark:border-r">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                    <div className="relative z-20 flex h-full flex-col justify-between p-10">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            Admotion AI
                        </div>
                        <div className="space-y-6">
                            <blockquote className="space-y-2">
                                <p className="text-lg">
                                    &ldquo;Admotion AI has completely transformed how we manage our ad campaigns. The AI insights are game-changing.&rdquo;
                                </p>
                                <footer className="text-sm text-zinc-400">Sofia Davis, VP of Marketing</footer>
                            </blockquote>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                    <span>AI-powered campaign optimization</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                    <span>Real-time analytics dashboard</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                    <span>Seamless team collaboration</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
