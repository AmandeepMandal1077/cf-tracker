import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Solid, dark, minimal input; clarity on focus, no glow
          "flex h-10 w-full rounded-lg border border-white/10 bg-black px-3 text-sm text-white placeholder:text-white/40",
          // Focus: increase border clarity; no shadow/glow, short linear
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20 focus-visible:border-white/25",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-60",
          // Transition
          "transition-colors duration-150 ease-linear",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
