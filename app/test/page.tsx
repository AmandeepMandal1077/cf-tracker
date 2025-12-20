import AppShell from "@/components/layouts/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  return (
    <AppShell maxWidth="md">
      <Card className="border-white/10 bg-neutral-950 text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Test Page</CardTitle>
        </CardHeader>
        <CardContent className="text-neutral-300">
          Use this route to validate UI and data flows.
        </CardContent>
      </Card>
    </AppShell>
  );
}
