import { createSignal, type JSX } from "solid-js";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: JSX.Element;
  class?: string;
}

export function Tooltip(props: TooltipProps) {
  const [show, setShow] = createSignal(false);

  return (
    <div
      class="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {props.children}
      {show() && (
        <div
          class={cn(
            "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-[10px] font-medium text-white bg-[#18181B] rounded-lg whitespace-nowrap shadow-lg",
            props.class
          )}
        >
          {props.content}
        </div>
      )}
    </div>
  );
}
