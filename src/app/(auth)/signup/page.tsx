'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Zap, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { createClient } from '@/lib/db/client';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Password strength
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error: signUpError, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError('This email is already registered. Please sign in instead.');
                } else {
                    setError(signUpError.message);
                }
                return;
            }

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                setError('This email is already registered. Please sign in instead.');
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
            <div className="flex items-center justify-center py-12 px-4">
                <div className="mx-auto grid w-full max-w-[400px] gap-6">
                    <div className="grid gap-2 text-center">
                        <div className="flex justify-center mb-4 lg:hidden">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Zap className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-balance text-muted-foreground">
                            Start creating amazing ads with AI
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4 p-6 bg-green-50 border border-green-200 rounded-xl">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
                            <p className="text-gray-600">
                                We&apos;ve sent a confirmation link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500">
                                Click the link in the email to activate your account.
                            </p>
                            <div className="pt-2">
                                <Link href="/login">
                                    <Button variant="outline" className="w-full">
                                        Go to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input 
                                    id="fullName" 
                                    placeholder="John Doe" 
                                    required 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-11" 
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input 
                                        id="password" 
                                        type={showPassword ? 'text' : 'password'}
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 pr-10" 
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="space-y-1 text-xs mt-1">
                                        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>One uppercase letter</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>One number</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                                disabled={isLoading || !hasMinLength}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </Button>

                            <p className="text-xs text-center text-gray-500">
                                By signing up, you agree to our{' '}
                                <Link href="/terms" className="underline hover:text-gray-700">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>
                            </p>
                        </form>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
            {/* Right Panel - Branding */}
            <div className="hidden bg-muted lg:block relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                    <div className="relative z-20 flex h-full flex-col justify-between p-10">
                        <div className="flex items-center gap-3 font-bold text-2xl text-white">
                            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            Admotion AI
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-white leading-tight">
                                    Join thousands of<br />marketers worldwide
                                </h2>
                                <p className="text-lg text-white/80 max-w-md">
                                    Create professional ad campaigns in minutes with our AI-powered platform.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Free 14-day trial</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Cancel anytime</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-white/50">
                            © 2025 Admotion AI. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
