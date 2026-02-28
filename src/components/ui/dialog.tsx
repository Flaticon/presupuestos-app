import { createEffect, onCleanup, type JSX, Show } from "solid-js";
import { cn } from "@/lib/utils";
import { X } from "lucide-solid";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
  class?: string;
}

export function Dialog(props: DialogProps) {
  createEffect(() => {
    if (!props.open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    document.addEventListener("keydown", handleKey);
    onCleanup(() => document.removeEventListener("keydown", handleKey));
  });

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={props.onClose}
        />
        {/* Panel */}
        <div
          class={cn(
            "relative z-10 w-full max-w-lg mx-4 bg-card rounded-xl border border-border shadow-2xl",
            "animate-in fade-in zoom-in-95 duration-200",
            props.class
          )}
        >
          <button
            onClick={props.onClose}
            class="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-text-soft hover:text-text"
          >
            <X size={18} />
          </button>
          {props.children}
        </div>
      </div>
    </Show>
  );
}

export function DialogHeader(props: { children: JSX.Element; class?: string }) {
  return <div class={cn("px-6 pt-6 pb-2", props.class)}>{props.children}</div>;
}

export function DialogBody(props: { children: JSX.Element; class?: string }) {
  return <div class={cn("px-6 py-4", props.class)}>{props.children}</div>;
}

export function DialogFooter(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={cn("px-6 pb-6 pt-2 flex justify-end gap-2", props.class)}>
      {props.children}
    </div>
  );
}
