import { splitProps, type JSX } from "solid-js";
import { cn } from "@/lib/utils";

function Card(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden", local.class)}
      {...rest}
    />
  );
}

function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("flex flex-col gap-1.5 px-4 py-3", local.class)}
      {...rest}
    />
  );
}

function CardTitle(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("text-[13px] font-semibold leading-none tracking-tight", local.class)}
      {...rest}
    />
  );
}

function CardDescription(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("text-xs text-muted-foreground", local.class)}
      {...rest}
    />
  );
}

function CardContent(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class={cn("px-4 py-3", local.class)} {...rest} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
