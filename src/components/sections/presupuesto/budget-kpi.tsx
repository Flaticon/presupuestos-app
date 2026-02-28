import { StatCard } from "@/components/shared/stat-card";
import { fmtS } from "@/lib/utils";

interface BudgetKPIProps {
  grandTotal: number;
  totalItems: number;
  totalGroups: number;
  totalSections: number;
}

export function BudgetKPI(props: BudgetKPIProps) {
  return (
    <div class="grid grid-cols-2 gap-3">
      <StatCard value={fmtS(props.grandTotal)} label="TOTAL PRESUPUESTO" color="#059669" />
      <StatCard
        value={props.totalItems}
        label={`items en ${props.totalGroups} sub-partidas · ${props.totalSections} partidas`}
        color="#2563EB"
      />
    </div>
  );
}
