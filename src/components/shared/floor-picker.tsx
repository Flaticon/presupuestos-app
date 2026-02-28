import { createSignal, For, Show } from "solid-js";
import { useFloors } from "@/lib/floor-context";
import { Plus, ChevronDown } from "lucide-solid";

interface FloorPickerProps {
  existingFloors: string[];
  onAddFloor: (floorId: string) => void;
}

export function FloorPicker(props: FloorPickerProps) {
  const { floors, addFloor } = useFloors();
  const [open, setOpen] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  const [newLabel, setNewLabel] = createSignal("");
  const [newShort, setNewShort] = createSignal("");
  const [newColor, setNewColor] = createSignal("#8B5CF6");

  const available = () => floors().filter((f) => f.active && !props.existingFloors.includes(f.id));

  const handleCreate = () => {
    const label = newLabel().trim();
    const short = newShort().trim() || label.substring(0, 2).toUpperCase();
    if (!label) return;
    addFloor(label, short, newColor());
    const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    props.onAddFloor(id);
    setCreating(false);
    setOpen(false);
    setNewLabel("");
    setNewShort("");
  };

  return (
    <div class="relative inline-block">
      <button
        onClick={() => setOpen(!open())}
        class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
      >
        <Plus size={12} />
        Piso
        <ChevronDown size={10} />
      </button>

      <Show when={open()}>
        <div class="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg min-w-[180px] overflow-hidden">
          <Show when={available().length > 0}>
            <For each={available()}>
              {(floor) => (
                <button
                  onClick={() => { props.onAddFloor(floor.id); setOpen(false); }}
                  class="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center gap-2 cursor-pointer"
                >
                  <span class="w-2.5 h-2.5 rounded-full" style={{ "background-color": floor.color }} />
                  {floor.label}
                </button>
              )}
            </For>
            <div class="border-t border-border" />
          </Show>

          <Show when={!creating()} fallback={
            <div class="p-3 space-y-2">
              <input
                autofocus
                placeholder="Nombre (ej: 4to Piso)"
                value={newLabel()}
                onInput={(e) => setNewLabel(e.currentTarget.value)}
                class="w-full text-xs border border-border rounded px-2 py-1"
              />
              <div class="flex gap-2">
                <input
                  placeholder="Abrev."
                  value={newShort()}
                  onInput={(e) => setNewShort(e.currentTarget.value)}
                  class="flex-1 text-xs border border-border rounded px-2 py-1"
                />
                <input
                  type="color"
                  value={newColor()}
                  onInput={(e) => setNewColor(e.currentTarget.value)}
                  class="w-8 h-7 rounded border border-border cursor-pointer"
                />
              </div>
              <div class="flex gap-2">
                <button
                  onClick={handleCreate}
                  class="flex-1 text-xs bg-primary text-white rounded px-2 py-1 cursor-pointer hover:bg-primary/90"
                >
                  Crear
                </button>
                <button
                  onClick={() => setCreating(false)}
                  class="text-xs text-text-soft px-2 py-1 cursor-pointer hover:text-text"
                >
                  Cancelar
                </button>
              </div>
            </div>
          }>
            <button
              onClick={() => setCreating(true)}
              class="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center gap-2 cursor-pointer text-primary"
            >
              <Plus size={12} />
              Crear nuevo piso
            </button>
          </Show>
        </div>
      </Show>
    </div>
  );
}
