import { createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { useProject } from "@/lib/project-context";
import { getProjectLabel } from "@/lib/project-types";
import { ChevronDown, FolderOpen, LogOut } from "lucide-solid";

export function ProjectSwitcher() {
  const { projects, activeProject, setActiveProject, exitToLanding } = useProject();
  const [open, setOpen] = createSignal(false);
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (!open()) return;
    const handleClick = (e: MouseEvent) => {
      if (ref && !ref.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    onCleanup(() => document.removeEventListener("mousedown", handleClick));
  });

  return (
    <Show when={activeProject()}>
      {(project) => (
        <div ref={ref} class="relative px-3 mb-2">
          <button
            onClick={() => setOpen((v) => !v)}
            class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200 cursor-pointer"
          >
            <FolderOpen size={14} class="shrink-0" />
            <span class="truncate flex-1 text-left">{project().name}</span>
            <ChevronDown size={14} class={`shrink-0 transition-transform duration-200 ${open() ? "rotate-180" : ""}`} />
          </button>

          <Show when={open()}>
            <div class="absolute left-3 right-3 top-full mt-1 bg-[#1A2236] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50">
              <For each={projects()}>
                {(p) => (
                  <button
                    onClick={() => {
                      setActiveProject(p.id);
                      setOpen(false);
                    }}
                    class={`w-full text-left px-3 py-2.5 text-[12px] transition-colors cursor-pointer ${
                      p.id === project().id
                        ? "bg-primary/20 text-primary font-semibold"
                        : "text-white/50 hover:bg-white/[0.06] hover:text-white/70"
                    }`}
                  >
                    <div class="truncate">{p.name}</div>
                    <div class="text-[10px] opacity-60 truncate">{getProjectLabel(p)}</div>
                  </button>
                )}
              </For>
              <div class="border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    exitToLanding();
                    setOpen(false);
                  }}
                  class="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-white/40 hover:bg-white/[0.06] hover:text-white/60 transition-colors cursor-pointer"
                >
                  <LogOut size={12} />
                  <span>Todos los proyectos</span>
                </button>
              </div>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
