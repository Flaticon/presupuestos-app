import { createEffect, createSignal, onCleanup } from "solid-js";
import { cn } from "@/lib/utils";

interface FlashValueProps {
  value: string | number;
  class?: string;
  format?: (v: string | number) => string;
}

export function FlashValue(props: FlashValueProps) {
  let prev = props.value;
  const [flash, setFlash] = createSignal(false);

  createEffect(() => {
    const val = props.value;
    if (prev !== val) {
      prev = val;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      onCleanup(() => clearTimeout(t));
    }
  });

  const display = () => {
    if (props.format) return props.format(props.value);
    if (typeof props.value === "number")
      return props.value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return props.value;
  };

  return (
    <span class={cn(flash() && "cell-flash", props.class)}>
      {display()}
    </span>
  );
}
