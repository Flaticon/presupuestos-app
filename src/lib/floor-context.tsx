import { createContext, useContext, createSignal, createEffect, createMemo, type JSX } from "solid-js";
import { z } from "zod/v4";
import type { Nivel } from "./types";
import { NivelSchema, safeParse } from "./schemas";
import { usePersistence } from "@/hooks/use-persistence";

const STORAGE_KEY = "metrados-floors";

const DEFAULT_FLOORS: Nivel[] = [
  { id: "3er-piso", label: "3er Piso", shortLabel: "3P", orden: 1, active: true, color: "#3B82F6" },
  { id: "azotea", label: "Azotea", shortLabel: "AZ", orden: 2, active: true, color: "#F59E0B" },
];

interface FloorContextValue {
  floors: () => Nivel[];
  activeFloors: () => Nivel[];
  toggleFloor: (id: string) => void;
  addFloor: (label: string, shortLabel: string, color: string) => void;
  removeFloor: (id: string) => void;
}

const FloorContext = createContext<FloorContextValue>();

const isBrowser = typeof window !== "undefined";

function loadFloors(): Nivel[] | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return safeParse(z.array(NivelSchema), parsed, "floors");
    }
  } catch (e) {
    console.warn("[metrados] floors: error al leer localStorage", e);
  }
  return null;
}

function saveFloors(floors: Nivel[]) {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(floors));
}

function initFloors(): Nivel[] {
  const saved = loadFloors();
  if (saved && saved.length > 0) return saved;
  saveFloors(DEFAULT_FLOORS);
  return DEFAULT_FLOORS;
}

export function FloorProvider(props: { children: JSX.Element }) {
  const [floors, setFloors] = createSignal<Nivel[]>(initFloors());

  createEffect(() => {
    saveFloors(floors());
  });
  usePersistence("floors", floors, setFloors);

  const activeFloors = createMemo(() => floors().filter((f) => f.active));

  function toggleFloor(id: string) {
    setFloors((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  }

  function addFloor(label: string, shortLabel: string, color: string) {
    setFloors((prev) => {
      const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const orden = prev.length > 0 ? Math.max(...prev.map((f) => f.orden)) + 1 : 1;
      return [...prev, { id, label, shortLabel, orden, active: true, color }];
    });
  }

  function removeFloor(id: string) {
    if (id === "3er-piso" || id === "azotea") return;
    setFloors((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <FloorContext.Provider value={{ floors, activeFloors, toggleFloor, addFloor, removeFloor }}>
      {props.children}
    </FloorContext.Provider>
  );
}

export function useFloors() {
  const ctx = useContext(FloorContext);
  if (!ctx) throw new Error("useFloors must be used within FloorProvider");
  return ctx;
}
