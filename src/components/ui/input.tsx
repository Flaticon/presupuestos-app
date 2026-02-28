import { splitProps, type JSX } from "solid-js";
import { cn } from "@/lib/utils";

function Input(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ["class", "type"]);
  return (
    <input
      type={local.type}
      class={cn(
        "flex h-8 w-full rounded-lg border border-border bg-white px-2.5 py-1 text-xs text-right transition-all duration-200 placeholder:text-text-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:border-primary",
        local.class
      )}
      {...rest}
    />
  );
}

export { Input };
