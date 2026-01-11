"use client";

import AppShell from "@/components/layouts/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

export default function AdminPage() {
  const callScrape = async () => {
    try {
      const res = await axios("/api/scrape");
    } catch (error) {
      console.error("Error calling scrape API:", error);
    }
  };
  return (
    <AppShell>
      <Card className="border-white/10 bg-neutral-950 text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Admin</CardTitle>
        </CardHeader>
        <CardContent className="text-neutral-300">
          Minimal admin area. Add controls here.
          <button onClick={callScrape}>TEST</button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
