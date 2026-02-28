import type { BudgetItem } from "@/lib/types";

export interface PendingEdit {
  si: number;
  gi: number;
  ii: number;
}

export interface BudgetHandlers {
  updateDesc: (si: number, gi: number, ii: number, v: string) => void;
  updateCU: (si: number, gi: number, ii: number, v: number) => void;
  updateMet: (si: number, gi: number, ii: number, v: number) => void;
  addItem: (si: number, gi: number, currentLen: number, item?: BudgetItem) => void;
  delItem: (si: number, gi: number, ii: number) => void;
  syncArea: (si: number, gi: number, newArea: number) => void;
  updateFactor: (si: number, gi: number, ii: number, factor: number) => void;
  toggleItemFactor: (si: number, gi: number, ii: number) => void;
  updateArea: (si: number, gi: number, newArea: number) => void;
  toggleAreaSource: (si: number, gi: number) => void;
  updateCat: (si: number, gi: number, newName: string) => void;
  updateSectionTitle: (si: number, newTitle: string) => void;
  addSection: () => void;
  delSection: (si: number) => void;
  addGroup: (si: number) => void;
  delGroup: (si: number, gi: number) => void;
}
