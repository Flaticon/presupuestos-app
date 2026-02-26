interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
}

export function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-md"
      style={{ backgroundColor: color }}
    >
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10" />
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/[0.08]" />
      <div className="absolute -right-1 top-8 w-12 h-12 rounded-full bg-white/[0.05]" />
      <div className="relative">
        <div className="text-[22px] font-extrabold text-white leading-none tracking-tight">
          {value}
        </div>
        <div className="text-[11px] text-white/65 mt-1.5 font-medium uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
}
