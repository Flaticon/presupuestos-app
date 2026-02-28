interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
}

export function StatCard(props: StatCardProps) {
  return (
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="text-2xl font-bold text-text leading-none tracking-tight">
        {props.value}
      </div>
      <div class="text-[11px] text-text-soft mt-1.5 font-medium uppercase tracking-wide">
        {props.label}
      </div>
      <div class="h-0.5 w-8 rounded-full mt-2.5" style={{ "background-color": props.color }} />
    </div>
  );
}
