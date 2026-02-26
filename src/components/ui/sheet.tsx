import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}

export function Sheet({ open, onClose, children, className, side = "left" }: SheetProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 z-50 h-full w-[280px] shadow-2xl transition-transform duration-300 ease-in-out",
          side === "left" ? "left-0" : "right-0",
          side === "left"
            ? open ? "translate-x-0" : "-translate-x-full"
            : open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </>
  );
}
