import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FlashValueProps {
  value: string | number;
  className?: string;
  format?: (v: string | number) => string;
}

export function FlashValue({ value, className, format }: FlashValueProps) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = format
    ? format(value)
    : typeof value === "number"
      ? value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;

  return (
    <span className={cn(flash && "cell-flash", className)}>
      {display}
    </span>
  );
}
