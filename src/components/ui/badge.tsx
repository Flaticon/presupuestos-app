import { splitProps, type JSX } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-muted text-text-mid",
        destructive: "bg-danger/10 text-danger",
        outline: "border border-border text-text-mid",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends JSX.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ["class", "variant"]);
  return (
    <span class={cn(badgeVariants({ variant: local.variant }), local.class)} {...rest} />
  );
}

export { Badge, badgeVariants };
