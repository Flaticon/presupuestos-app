import { useState, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { getProjectLabel } from "@/lib/project-types";
import { ChevronDown, FolderOpen, LogOut } from "lucide-react";

export function ProjectSwitcher() {
  const { projects, activeProject, setActiveProject, exitToLanding } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!activeProject) return null;

  return (
    <div ref={ref} className="relative px-3 mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200 cursor-pointer"
      >
        <FolderOpen size={14} className="shrink-0" />
        <span className="truncate flex-1 text-left">{activeProject.name}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-[#1A2236] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-[12px] transition-colors cursor-pointer ${
                p.id === activeProject.id
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/70"
              }`}
            >
              <div className="truncate">{p.name}</div>
              <div className="text-[10px] opacity-60 truncate">{getProjectLabel(p)}</div>
            </button>
          ))}
          <div className="border-t border-white/[0.06]">
            <button
              onClick={() => {
                exitToLanding();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-white/40 hover:bg-white/[0.06] hover:text-white/60 transition-colors cursor-pointer"
            >
              <LogOut size={12} />
              <span>Todos los proyectos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
