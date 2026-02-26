import { useState } from "react";
import { useProject } from "@/lib/project-context";
import { getProjectLabel } from "@/lib/project-types";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  building: "",
  floor: "",
  city: "",
  engineer: "",
  cip: "",
  fc: 210,
  fy: 4200,
  norm: "NTE E.060",
};

export function LandingScreen() {
  const { projects, setActiveProject, createProject, deleteProject } = useProject();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (!form.name.trim() || !form.floor.trim()) return;
    createProject(form);
    setForm(EMPTY_FORM);
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1222] via-[#111827] to-[#0C1222] flex flex-col items-center justify-center p-6">
      {/* Branding */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-[#3B82F6] flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-white font-black text-2xl">M</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">GLOBAL INGENIEROS E.I.R.L.</h1>
        <p className="text-white/40 text-sm mt-1.5">Sistema de Metrados y Presupuestos</p>
      </div>

      {/* Project cards grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="group relative bg-white/[0.06] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.10] hover:border-white/[0.15] transition-all duration-200 cursor-pointer"
            onClick={() => setActiveProject(p.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="text-xs text-white/40 mt-0.5">{getProjectLabel(p)}</div>
                <div className="text-[10px] text-white/25 mt-1">
                  f'c={p.fc} · fy={p.fy} · {p.city}
                </div>
              </div>
            </div>
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(p.id);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        ))}

        {/* New project card */}
        <button
          onClick={() => setShowNew(true)}
          className="bg-white/[0.03] border-2 border-dashed border-white/[0.10] rounded-2xl p-5 flex items-center justify-center gap-2 text-white/30 hover:text-white/50 hover:border-white/[0.20] hover:bg-white/[0.05] transition-all duration-200 cursor-pointer min-h-[100px]"
        >
          <Plus size={20} />
          <span className="text-sm font-medium">Nuevo Proyecto</span>
        </button>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)}>
        <DialogHeader>
          <h2 className="text-lg font-bold text-text">Eliminar proyecto</h2>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-mid">
            Este proyecto se eliminará permanentemente. Los datos de metrados no se perderán ya que están integrados en la aplicación.
          </p>
        </DialogBody>
        <DialogFooter>
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-4 py-2 text-sm font-medium text-text-mid rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </DialogFooter>
      </Dialog>

      {/* New project dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)}>
        <DialogHeader>
          <h2 className="text-lg font-bold text-text">Nuevo Proyecto</h2>
          <p className="text-xs text-text-soft mt-1">Ingresa los datos del proyecto</p>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <LabelInput label="Nombre *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder='Tienda "X"' />
              <LabelInput label="Edificio" value={form.building} onChange={(v) => setForm((f) => ({ ...f, building: v }))} placeholder="Edificio X" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LabelInput label="Piso *" value={form.floor} onChange={(v) => setForm((f) => ({ ...f, floor: v }))} placeholder="3er Piso" />
              <LabelInput label="Ciudad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="Trujillo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LabelInput label="Ingeniero" value={form.engineer} onChange={(v) => setForm((f) => ({ ...f, engineer: v }))} placeholder="Nombre completo" />
              <LabelInput label="CIP" value={form.cip} onChange={(v) => setForm((f) => ({ ...f, cip: v }))} placeholder="000000" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <LabelInput label="f'c (kg/cm²)" value={String(form.fc)} onChange={(v) => setForm((f) => ({ ...f, fc: Number(v) || 0 }))} />
              <LabelInput label="fy (kg/cm²)" value={String(form.fy)} onChange={(v) => setForm((f) => ({ ...f, fy: Number(v) || 0 }))} />
              <LabelInput label="Norma" value={form.norm} onChange={(v) => setForm((f) => ({ ...f, norm: v }))} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <button
            onClick={() => setShowNew(false)}
            className="px-4 py-2 text-sm font-medium text-text-mid rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name.trim() || !form.floor.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crear Proyecto
          </button>
        </DialogFooter>
      </Dialog>

      {/* Footer */}
      <div className="mt-10 text-center text-[10px] text-white/20">
        Global Ingenieros E.I.R.L. · Sistema de Metrados
      </div>
    </div>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-mid">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/50 text-text placeholder:text-text-soft/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
    </label>
  );
}
