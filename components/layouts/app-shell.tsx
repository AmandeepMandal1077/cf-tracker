"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  className?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl";
};

/**
 * AppShell - Unified layout wrapper for all non-auth routes
 * Extends the same visual system as AuthShell: black background, minimal styling, no effects
 */
export function AppShell({
  className,
  children,
  maxWidth = "7xl",
}: AppShellProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "7xl": "max-w-7xl",
  };

  return (
    <div
      className={cn(
        "min-h-[calc(100dvh-4rem)] bg-black text-white px-4 sm:px-8 py-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export default AppShell;
