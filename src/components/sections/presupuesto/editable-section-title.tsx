import { createSignal, Show } from "solid-js";

interface EditableSectionTitleProps {
  value: string;
  onChange: (v: string) => void;
}

export function EditableSectionTitle(props: EditableSectionTitleProps) {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal(props.value);
  let inputRef: HTMLInputElement | undefined;

  const start = () => {
    setDraft(props.value);
    setEditing(true);
    setTimeout(() => inputRef?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft().trim() && draft().trim() !== props.value) props.onChange(draft().trim());
  };

  return (
    <Show
      when={editing()}
      fallback={
        <span
          onDblClick={start}
          class="text-sm font-bold text-white cursor-pointer hover:text-white/80"
          title="Doble click para editar"
        >
          {props.value}
        </span>
      }
    >
      <input
        ref={inputRef}
        autofocus
        value={draft()}
        onInput={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(props.value); setEditing(false); }
        }}
        class="text-sm font-bold text-white bg-white/10 border border-white/30 rounded px-1.5 py-0.5 outline-none min-w-[250px]"
      />
    </Show>
  );
}
