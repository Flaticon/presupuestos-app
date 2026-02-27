import { createContext, useContext, useCallback, useRef, useSyncExternalStore, type ReactNode } from "react";

interface FloorAggregates {
  areaBruta: number;
  areaNueva: number;
  lad: number;
  mort: number;
  cem: number;
  arena: number;
}

export interface SectionAggregates {
  muros: { byFloor: Record<string, FloorAggregates> } | null;
  vigas: { encTotal: number } | null;
  columnas: { areaTarrajeo: number } | null;
  losa: { areaTotal: number } | null;
  escalera: { encTotal: number } | null;
}

type Listener = () => void;

class SectionDataStore {
  private data: SectionAggregates = { muros: null, vigas: null, columnas: null, losa: null, escalera: null };
  private listeners = new Set<Listener>();

  getSnapshot = () => this.data;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  updateSection<K extends keyof SectionAggregates>(key: K, value: SectionAggregates[K]) {
    this.data = { ...this.data, [key]: value };
    this.listeners.forEach((l) => l());
  }
}

const StoreContext = createContext<SectionDataStore | null>(null);

export function SectionDataProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SectionDataStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new SectionDataStore();
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useSectionData(): SectionAggregates {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useSectionData must be used within SectionDataProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function usePublishSection() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("usePublishSection must be used within SectionDataProvider");

  const publish = useCallback(
    <K extends keyof SectionAggregates>(key: K, value: SectionAggregates[K]) => {
      store.updateSection(key, value);
    },
    [store]
  );

  return publish;
}
