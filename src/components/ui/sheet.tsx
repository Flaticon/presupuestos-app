import { type JSX } from "solid-js";
import { cn } from "@/lib/utils";
import { X } from "lucide-solid";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
  class?: string;
  side?: "left" | "right";
}

export function Sheet(props: SheetProps) {
  return (
    <>
      {/* Overlay */}
      <div
        class={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          props.open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={props.onClose}
      />
      {/* Panel */}
      <div
        class={cn(
          "fixed top-0 z-50 h-full w-[280px] shadow-2xl transition-transform duration-300 ease-in-out",
          (props.side ?? "left") === "left" ? "left-0" : "right-0",
          (props.side ?? "left") === "left"
            ? props.open ? "translate-x-0" : "-translate-x-full"
            : props.open ? "translate-x-0" : "translate-x-full",
          props.class
        )}
      >
        <button
          onClick={props.onClose}
          class="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white"
        >
          <X size={18} />
        </button>
        {props.children}
      </div>
    </>
  );
}
