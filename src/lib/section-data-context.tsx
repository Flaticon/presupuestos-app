import { createContext, useContext, createSignal, createEffect, onCleanup, type JSX } from "solid-js";

export interface SteelAgg {
  v34: number; v58: number; v12: number; v38: number; v14: number;
}

interface FloorAggregates {
  areaBruta: number;
  areaNueva: number;
  lad: number;
  mort: number;
  cem: number;
  arena: number;
}

interface ColumnFloorAgg {
  areaTarrajeo: number;
  volTotal: number;
  steel: SteelAgg;
}

export interface VigaFloorAgg {
  encTotal: number;
  volTotal: number;
  steel: SteelAgg;
}

export interface LosaFloorAgg {
  areaTotal: number;
  volTotal: number;
  ladrillos: number;
}

export interface EscaleraFloorAgg {
  encTotal: number;
  volTotal: number;
  steel: SteelAgg;
}

export interface SectionAggregates {
  muros: { byFloor: Record<string, FloorAggregates> } | null;
  vigas: { encTotal: number; volTotal: number; steel: SteelAgg; byFloor: Record<string, VigaFloorAgg> } | null;
  columnas: { areaTarrajeo: number; volTotal: number; steel: SteelAgg; byFloor: Record<string, ColumnFloorAgg> } | null;
  losa: { areaTotal: number; volTotal: number; ladrillos: number; byFloor: Record<string, LosaFloorAgg> } | null;
  escalera: { encTotal: number; volTotal: number; steel: SteelAgg; byFloor: Record<string, EscaleraFloorAgg> } | null;
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

const StoreContext = createContext<SectionDataStore>();

export function SectionDataProvider(props: { children: JSX.Element }) {
  const store = new SectionDataStore();

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useSectionData() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useSectionData must be used within SectionDataProvider");
  const [data, setData] = createSignal(store.getSnapshot());
  createEffect(() => {
    const unsub = store.subscribe(() => setData(store.getSnapshot()));
    onCleanup(unsub);
  });
  return data;
}

export function usePublishSection() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("usePublishSection must be used within SectionDataProvider");

  return function publish<K extends keyof SectionAggregates>(key: K, value: SectionAggregates[K]) {
    store.updateSection(key, value);
  };
}
