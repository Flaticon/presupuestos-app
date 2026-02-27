import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { ProjectInfo } from "./project-types";
import { DEFAULT_PROJECT } from "./project-defaults";
import { usePersistence } from "@/hooks/use-persistence";

const STORAGE_KEY = "metrados-projects";
const ACTIVE_KEY = "metrados-active-project";

interface ProjectContextValue {
  projects: ProjectInfo[];
  activeProject: ProjectInfo | null;
  createProject: (data: Omit<ProjectInfo, "id" | "createdAt" | "updatedAt">) => ProjectInfo;
  updateProject: (id: string, data: Partial<Omit<ProjectInfo, "id" | "createdAt">>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  exitToLanding: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const isBrowser = typeof window !== "undefined";

function loadProjects(): ProjectInfo[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
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
  } catch {}
  return null;
}

function saveActiveId(id: string | null) {
  if (!isBrowser) return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectInfo[]>(() => {
    const saved = loadProjects();
    if (saved.length > 0) return saved;
    // Seed with default Miguelitos project
    saveProjects([DEFAULT_PROJECT]);
    return [DEFAULT_PROJECT];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = loadActiveId();
    // If no active project saved, auto-select default
    if (!saved && projects.length > 0) {
      saveActiveId(projects[0].id);
      return projects[0].id;
    }
    return saved;
  });

  const activeProject = projects.find((p) => p.id === activeId) ?? null;

  usePersistence("projects", projects, setProjects);
  usePersistence("active_project", activeId, setActiveId);

  // Sync to localStorage on change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  // Update document title
  useEffect(() => {
    if (activeProject) {
      document.title = `Metrados — ${activeProject.floor} ${activeProject.name}`;
    } else {
      document.title = "Metrados — Global Ingenieros";
    }
  }, [activeProject]);

  const createProject = useCallback(
    (data: Omit<ProjectInfo, "id" | "createdAt" | "updatedAt">): ProjectInfo => {
      const now = new Date().toISOString();
      const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const project: ProjectInfo = { ...data, id, createdAt: now, updatedAt: now };
      setProjects((prev) => [...prev, project]);
      setActiveId(id);
      return project;
    },
    []
  );

  const updateProject = useCallback(
    (id: string, data: Partial<Omit<ProjectInfo, "id" | "createdAt">>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        )
      );
    },
    []
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const setActiveProject = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const exitToLanding = useCallback(() => {
    setActiveId(null);
  }, []);

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, createProject, updateProject, deleteProject, setActiveProject, exitToLanding }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
