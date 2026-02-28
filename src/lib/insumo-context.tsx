import { createContext, useContext, createSignal, type JSX } from "solid-js";
import { INSUMOS_INIT, type Insumo } from "@/data/insumos-data";
import { usePersistence } from "@/hooks/use-persistence";

interface InsumoContextValue {
  insumos: () => Insumo[];
  addInsumo: (insumo: Omit<Insumo, "id">) => void;
  updateInsumo: (id: string, partial: Partial<Omit<Insumo, "id">>) => void;
  deleteInsumo: (id: string) => void;
}

const InsumoContext = createContext<InsumoContextValue>();

export function InsumoProvider(props: { children: JSX.Element }) {
  const [insumos, setInsumos] = createSignal<Insumo[]>(
    INSUMOS_INIT.map((i) => ({ ...i }))
  );
  usePersistence("insumos", insumos, setInsumos);

  function addInsumo(data: Omit<Insumo, "id">) {
    const id = crypto.randomUUID().slice(0, 8);
    setInsumos((prev) => [...prev, { id, ...data }]);
  }

  function updateInsumo(id: string, partial: Partial<Omit<Insumo, "id">>) {
    setInsumos((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...partial } : i))
    );
  }

  function deleteInsumo(id: string) {
    setInsumos((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <InsumoContext.Provider value={{ insumos, addInsumo, updateInsumo, deleteInsumo }}>
      {props.children}
    </InsumoContext.Provider>
  );
}

export function useInsumos() {
  const ctx = useContext(InsumoContext);
  if (!ctx) throw new Error("useInsumos must be used within InsumoProvider");
  return ctx;
}
