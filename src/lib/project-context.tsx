import { createContext, useContext, createSignal, createEffect, createMemo, type JSX } from "solid-js";
import { z } from "zod/v4";
import type { ProjectInfo } from "./project-types";
import { DEFAULT_PROJECT } from "./project-defaults";
import { ProjectInfoSchema, safeParse } from "./schemas";
import { usePersistence } from "@/hooks/use-persistence";

const STORAGE_KEY = "metrados-projects";
const ACTIVE_KEY = "metrados-active-project";

interface ProjectContextValue {
  projects: () => ProjectInfo[];
  activeProject: () => ProjectInfo | null;
  createProject: (data: Omit<ProjectInfo, "id" | "createdAt" | "updatedAt">) => ProjectInfo;
  updateProject: (id: string, data: Partial<Omit<ProjectInfo, "id" | "createdAt">>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  exitToLanding: () => void;
}

const ProjectContext = createContext<ProjectContextValue>();

const isBrowser = typeof window !== "undefined";

function loadProjects(): ProjectInfo[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = safeParse(z.array(ProjectInfoSchema), parsed, "projects");
      if (validated) return validated;
    }
  } catch (e) {
    console.warn("[metrados] projects: error al leer localStorage", e);
  }
  return [];
}

function saveProjects(projects: ProjectInfo[]) {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadActiveId(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch (e) {
    console.warn("[metrados] active_project: error al leer localStorage", e);
  }
  return null;
}

function saveActiveId(id: string | null) {
  if (!isBrowser) return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

function initProjects(): ProjectInfo[] {
  const saved = loadProjects();
  if (saved.length > 0) return saved;
  saveProjects([DEFAULT_PROJECT]);
  return [DEFAULT_PROJECT];
}

export function ProjectProvider(props: { children: JSX.Element }) {
  const initialProjects = initProjects();
  const [projects, setProjects] = createSignal<ProjectInfo[]>(initialProjects);

  const savedActiveId = loadActiveId();
  const initialActiveId = savedActiveId ?? (initialProjects.length > 0 ? initialProjects[0].id : null);
  if (!savedActiveId && initialActiveId) saveActiveId(initialActiveId);
  const [activeId, setActiveId] = createSignal<string | null>(initialActiveId);

  const activeProject = createMemo(() => projects().find((p) => p.id === activeId()) ?? null);

  usePersistence("projects", projects, setProjects);
  usePersistence("active_project", activeId, setActiveId);

  createEffect(() => {
    saveProjects(projects());
  });

  createEffect(() => {
    saveActiveId(activeId());
  });

  createEffect(() => {
    const ap = activeProject();
    if (ap) {
      document.title = `Metrados — ${ap.floor} ${ap.name}`;
    } else {
      document.title = "Metrados — Global Ingenieros";
    }
  });

  function createProject(data: Omit<ProjectInfo, "id" | "createdAt" | "updatedAt">): ProjectInfo {
    const now = new Date().toISOString();
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const project: ProjectInfo = { ...data, id, createdAt: now, updatedAt: now };
    setProjects((prev) => [...prev, project]);
    setActiveId(id);
    return project;
  }

  function updateProject(id: string, data: Partial<Omit<ProjectInfo, "id" | "createdAt">>) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
    );
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeId() === id) setActiveId(null);
  }

  function setActiveProject(id: string) {
    setActiveId(id);
  }

  function exitToLanding() {
    setActiveId(null);
  }

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, createProject, updateProject, deleteProject, setActiveProject, exitToLanding }}
    >
      {props.children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
