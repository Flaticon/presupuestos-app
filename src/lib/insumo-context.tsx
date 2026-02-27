import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { INSUMOS_INIT, type Insumo } from "@/data/insumos-data";
import { usePersistence } from "@/hooks/use-persistence";

interface InsumoContextValue {
  insumos: Insumo[];
  addInsumo: (insumo: Omit<Insumo, "id">) => void;
  updateInsumo: (id: string, partial: Partial<Omit<Insumo, "id">>) => void;
  deleteInsumo: (id: string) => void;
}

const InsumoContext = createContext<InsumoContextValue | null>(null);

export function InsumoProvider({ children }: { children: ReactNode }) {
  const [insumos, setInsumos] = useState<Insumo[]>(
    () => INSUMOS_INIT.map((i) => ({ ...i }))
  );
  usePersistence("insumos", insumos, setInsumos);

  const addInsumo = useCallback((data: Omit<Insumo, "id">) => {
    const id = crypto.randomUUID().slice(0, 8);
    setInsumos((prev) => [...prev, { id, ...data }]);
  }, []);

  const updateInsumo = useCallback((id: string, partial: Partial<Omit<Insumo, "id">>) => {
    setInsumos((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...partial } : i))
    );
  }, []);

  const deleteInsumo = useCallback((id: string) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <InsumoContext.Provider value={{ insumos, addInsumo, updateInsumo, deleteInsumo }}>
      {children}
    </InsumoContext.Provider>
  );
}

export function useInsumos() {
  const ctx = useContext(InsumoContext);
  if (!ctx) throw new Error("useInsumos must be used within InsumoProvider");
  return ctx;
}
