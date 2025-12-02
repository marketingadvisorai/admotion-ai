import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          Admotion AI
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Supercharge Your Ad Workflow
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              The all-in-one platform for managing ad campaigns, creative assets, and team collaboration with AI-powered insights.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-white/20 text-white hover:bg-white/10">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 border-t border-white/10 bg-zinc-950">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-zinc-400">Track performance metrics across all your campaigns in one unified dashboard.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-zinc-400">Invite team members, assign roles, and manage permissions seamlessly.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Optimization</h3>
              <p className="text-zinc-400">Let our AI analyze and optimize your ad creatives for maximum conversion.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-zinc-500 text-sm border-t border-white/10 bg-black">
        <p>© {new Date().getFullYear()} Admotion AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
