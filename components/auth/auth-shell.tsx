"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  className?: string;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function AuthShell({ className, children }: AuthShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center overflow-hidden bg-black text-white",
        className
      )}
    >
      <div className="w-full max-w-[480px] px-4">
        <Card
          // Mostly solid, thin border, subtle inner highlight; hover only brightens border slightly
          className={cn(
            "border-white/10 bg-neutral-950 text-white shadow-none",
            "ring-1 ring-inset ring-white/5",
            "transition-colors duration-150 ease-linear",
            "hover:border-white/20 hover:ring-white/10",
            // Tighten default card paddings to suit auth
            "py-6"
          )}
        >
          <CardContent className="px-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthShell;
