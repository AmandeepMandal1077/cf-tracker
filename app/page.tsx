import AppShell from "@/components/layouts/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell maxWidth="2xl">
      <Card className="border-white/10 bg-neutral-950 text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            CF Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-neutral-300">
          <p className="text-base">
            Sign in to sync your Codeforces progress and review your attempts
            with the same minimal, fast UI as the auth pages.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              className="flex-1 bg-white/90 text-black hover:bg-white"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 border-white/10 hover:border-white/20"
            >
              <a href="/dashboard">Go to dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
