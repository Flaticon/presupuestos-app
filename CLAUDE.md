# Metrados Project

App de presupuesto y metrados de construcción para 3er Piso "Tienda Miguelitos", Trujillo.
Ingeniero: Roberto González Carranza CIP 255614 — Global Ingenieros E.I.R.L.

## Stack

- **Framework:** Astro 5 + SolidJS 1.9 (client:load)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`, tokens en `src/styles/globals.css`
- **Charts:** Chart.js via `solid-chartjs`
- **Export:** xlsx + jspdf (lazy-loaded)
- **Deploy:** Cloudflare Pages + D1

## Comandos — siempre usar pnpm

```bash
pnpm dev        # dev server
pnpm build      # production build
pnpm preview    # preview production
```

## Estructura de archivos

```
src/
  pages/index.astro          → entry, monta <AppLayout client:load />
  components/
    layout/                  → app-layout, sidebar, header, landing
    sections/                → cada pestaña (columnas, vigas, losa, muros, escalera, presupuesto/, insumos-catalogo)
    shared/                  → edit-cell, flash-value, stat-card, spreadsheet-context, insumo-picker
    ui/                      → shadcn-style: button, card, table, badge, input, tooltip, sheet, dialog
    diagrams/                → SVG técnicos (columna, losa, escalera, estribo)
  data/                      → datos iniciales y constantes (budget-data, *-data, constants, budget-formulas)
  hooks/                     → use-persistence, use-undo-redo, use-spreadsheet-grid
  lib/                       → tipos, contextos (project, floor, section-data, insumo), helpers, export
  styles/globals.css         → design tokens como custom properties en @theme
```

## Convenciones

- **Español abreviado** en modelos de datos: `d` = descripción, `u` = unidad, `m` = metrado, `cu` = costo unitario, `alt` = altura, `vol` = volumen, etc.
- **Colores de acero:** `text-steel-34` (ø3/4"), `text-steel-58` (ø5/8"), `text-steel-12` (ø1/2"), `text-steel-38` (ø3/8"), `text-steel-14` (ø1/4")
- **Patrón spreadsheet:** `SpreadsheetProvider` + `EditCell` para edición inline tipo Excel (click selecciona, doble-click edita, Tab navega, Ctrl+Z/Y undo/redo)
- **State management:** `createSignal` local por sección + `SectionDataProvider` (external store + signal subscription) para compartir agregados entre secciones
- **Persistencia:** `usePersistence` hook recibe accessor (función) como segundo argumento
- **Path aliases:** `@/*` → `./src/*` (tsconfig.json)
- **Contextos (wrap order):** ProjectProvider → FloorProvider → SectionDataProvider → InsumoProvider → Dashboard
- **Budget traceability:** `areaSource.type` = "auto" (verde), "manual" (azul), "hybrid" (ámbar)
- **Iconos:** lucide-solid. Nota: `TrendingUp` para escalera (no existe `Stairs` en lucide)

## SolidJS — Reglas clave

- **NO destructurar props** — siempre usar `props.x` para mantener reactividad
- **`class` en vez de `className`** en todo el JSX
- **`onInput` en vez de `onChange`** para `<input>`, `<select>`, `<textarea>`
- **`onDblClick` en vez de `onDoubleClick`**
- **`e.currentTarget.value`** en vez de `e.target.value`
- **`createSignal` NO soporta lazy init** — evaluar fuera y pasar el valor
- **SVG attrs en kebab-case:** `stroke-width`, `stroke-dasharray`, `text-anchor`, `font-size`, etc.
- **`style` objects en kebab-case con strings:** `style={{ "max-width": "440px" }}`
- **Contextos** exponen accessors: `floors()`, `activeFloors()`, `projects()`, `activeProject()`, `insumos()`
- **`useUndoRedo`** retorna `{ state, stateAccessor, setState, undo, redo, canUndo, canRedo }` — `state` es getter, `stateAccessor` es signal accessor
- **Control flow:** Usar `<For>`, `<Show>`, `<Switch>`/`<Match>` en vez de `.map()` y ternarios

## Anti-patrones a evitar

- NO usar npm/yarn — solo pnpm
- NO crear archivos .md/README nuevos sin pedir
- NO agregar type annotations, docstrings o comments a código que no se modificó
- NO sobre-abstraer — si una función se usa una vez, no extraerla a un helper
- NO importar xlsx/jspdf de forma estática — usar `await import()` dinámico
- NO romper el barrel export de `presupuesto/index.ts` — app-layout importa de `@/components/sections/presupuesto`
- NO usar `useState`, `useCallback`, `useMemo`, `useEffect`, `useRef` de React — solo primitivas SolidJS
- NO destructurar props en componentes SolidJS — rompe la reactividad

## Deuda técnica conocida

- `resumen-s10.tsx` es otro archivo grande (~400 líneas) — candidato a refactorizar
- No hay tests unitarios ni e2e
- No hay CI/CD pipeline
- Migración D1 pendiente (solo localStorage por ahora)
