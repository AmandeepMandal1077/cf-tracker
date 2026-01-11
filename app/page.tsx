"use client";

import AppShell from "@/components/layouts/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();
  return (
    <div className="inset-0 top-16 bg-black m-4">
      <div className="flex flex-col items-center justify-center h-full">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl">
          <Badge
            variant="outline"
            className="border-white/20 bg-white/5 text-neutral-300 px-4 py-1.5"
          >
            Competitive Programming Tracker
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-linear-to-b from-white to-neutral-500 bg-clip-text text-transparent py-4 ">
            Track Your Codeforces Journey
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Stay on top of your competitive programming progress. Sync unsolved
            problems, track upsolving, and analyze your code—all in one minimal,
            lightning-fast platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-neutral-200 font-medium"
            >
              <Link href="/dashboard" className="shadow-xl shadow-gray-400/50">
                View Questions
              </Link>
            </Button>
            {isSignedIn || isSignedIn === undefined ? null : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 hover:border-white/40 hover:bg-white/5"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Features Section */}
        <Separator className="my-8 bg-white max-w-xs mx-auto " />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <Card className="border-white/10 bg-neutral-950/50 hover:border-white/30 transition-colors p-4">
            <CardHeader className="flex-row items-center gap-4 px-0">
              <div className="text-4xl">🔄</div>
              <CardTitle className="text-white">Smart Sync</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <CardDescription className="text-neutral-400">
                Automatically fetch unsolved problems and track questions you
                need to upsolve from contests.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-neutral-950/50 hover:border-white/30 transition-colors p-4">
            <CardHeader className="flex-row items-center gap-4 px-0">
              <div className="text-4xl">💻</div>
              <CardTitle className="text-white">Code Editor</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <CardDescription className="text-neutral-400">
                Write solutions in Monaco Editor with a clean, fast experience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-neutral-950/50 hover:border-white/30 transition-colors p-4">
            <CardHeader className="flex-row items-center gap-4 px-0">
              <div className="text-4xl">🔍</div>
              <CardTitle className="text-white">Code Analysis</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <CardDescription className="text-neutral-400">
                Get instant feedback on your code and identify issues without
                leaving the platform.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
          <span className="flex items-center gap-2">
            <span className="text-neutral-400">✓</span> Bookmark Problems
          </span>
          <span className="flex items-center gap-2">
            <span className="text-neutral-400">✓</span> Question Management
          </span>
          <span className="flex items-center gap-2">
            <span className="text-neutral-400">✓</span> Clean Dark UI
          </span>
        </div>
      </div>
    </div>
  );
}
