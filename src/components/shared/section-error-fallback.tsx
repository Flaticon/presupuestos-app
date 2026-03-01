import { AlertTriangle, RefreshCw } from "lucide-solid";
import { Card, CardContent } from "@/components/ui/card";

export function SectionErrorFallback(props: {
  error: Error;
  reset: () => void;
  section: string;
}) {
  return (
    <Card class="border-red-200 bg-red-50/50">
      <CardContent class="py-12 text-center">
        <AlertTriangle class="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-red-700 mb-2">
          Error en {props.section}
        </h3>
        <p class="text-sm text-red-600/80 mb-1">
          Ocurrio un error inesperado al renderizar esta seccion.
        </p>
        <p class="text-xs text-red-500/70 font-mono mb-6 max-w-md mx-auto truncate">
          {props.error.message}
        </p>
        <button
          onClick={props.reset}
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          <RefreshCw class="h-4 w-4" />
          Reintentar
        </button>
      </CardContent>
    </Card>
  );
}
