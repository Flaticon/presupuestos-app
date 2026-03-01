import { splitProps, type JSX } from "solid-js";
import { cn } from "@/lib/utils";

function Table(props: JSX.HTMLAttributes<HTMLTableElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class="-mx-0.5 px-0.5 w-full overflow-x-auto max-h-[70vh] overflow-y-auto">
      <table
        class={cn("w-full border-collapse text-xs", local.class)}
        {...rest}
      />
    </div>
  );
}

function TableHeader(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <thead class={cn("sticky top-0 z-10", local.class)} {...rest} />
  );
}

function TableBody(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tbody class={cn("", local.class)} {...rest} />
  );
}

function TableFooter(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tfoot class={cn("bg-primary-bg font-bold", local.class)} {...rest} />
  );
}

function TableRow(props: JSX.HTMLAttributes<HTMLTableRowElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tr
      class={cn("border-b border-border/80 transition-colors", local.class)}
      {...rest}
    />
  );
}

function TableHead(props: JSX.ThHTMLAttributes<HTMLTableCellElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <th
      class={cn(
        "px-2 py-2 bg-[#18181B] text-white/90 text-[10px] text-center font-medium uppercase tracking-wider whitespace-nowrap",
        local.class
      )}
      {...rest}
    />
  );
}

function TableCell(props: JSX.TdHTMLAttributes<HTMLTableCellElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <td
      class={cn("px-2 py-1.5 text-xs border-b border-border/80", local.class)}
      {...rest}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
