import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors duration-150 ease-linear overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-white/5 text-white [a&]:hover:bg-white/10 [a&]:hover:border-white/20",
        secondary:
          "border-neutral-700/50 bg-neutral-900/50 text-neutral-300 [a&]:hover:bg-neutral-900/80 [a&]:hover:border-neutral-700/80",
        destructive:
          "border-rose-500/20 bg-rose-500/10 text-rose-400 [a&]:hover:bg-rose-500/20 [a&]:hover:border-rose-500/30",
        outline:
          "border-white/10 text-neutral-300 [a&]:hover:bg-white/5 [a&]:hover:text-white [a&]:hover:border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
