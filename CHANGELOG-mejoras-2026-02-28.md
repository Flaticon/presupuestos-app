# Registro de Mejoras — 28 Feb 2026

**Proyecto:** Metrados — App de Presupuesto y Metrados de Construccion
**Stack:** Astro 5 + SolidJS 1.9 + Tailwind CSS 4 + Chart.js
**Ingeniero:** Roberto Gonzalez Carranza CIP 255614 — Global Ingenieros E.I.R.L.

---

## Resumen Ejecutivo

Se realizaron **14 cambios** en **22 archivos** organizados en 4 categorias:

| Categoria      | Cambios | Archivos |
|----------------|---------|----------|
| UX / UI        | 3       | 8        |
| Seguridad      | 2       | 4        |
| Calidad / Perf | 3       | 8        |
| Testing        | 6       | 7        |

Dependencia nueva: `zod@4.3.6` (validacion de schemas, ~17KB gzip)

---

## 1. Mejoras de UX / UI

### 1.1 Fix: Hover blanco en filas oscuras de tablas

**Problema:** Las filas con fondo oscuro (#18181B) — cabeceras de partidas, sub-partidas y totales — se volvian blancas al pasar el mouse.

**Causa:** El componente base `TableRow` en `src/components/ui/table.tsx` aplicaba `hover:bg-muted/40` a TODAS las filas. `muted` es gris claro, asi que sobre fondo negro creaba un efecto blanquecino.

**Solucion:**
- Removido hover por defecto del `TableRow` base
- Agregado hover explicito solo en filas de datos (items) con intensidad adecuada

**Archivos modificados:**
- `src/components/ui/table.tsx` — removido `hover:bg-muted/40`
- `src/components/sections/presupuesto/budget-detail-table.tsx` — hover en item rows
- `src/components/sections/partida-detail.tsx` — hover en item rows (ambos branches)
- `src/components/sections/resumen-s10/tipo-breakdown.tsx` — hover en data rows
- `src/components/sections/resumen-s10/consolidated-table.tsx` — hover en data rows

---

### 1.2 Feature: Crear sub-partidas desde vista Resumen S10

**Problema:** Solo se podia agregar sub-partidas desde la vista "Detalle". En "Resumen S10" no habia forma de crear sub-partidas para una partida.

**Solucion:**
- Agregada prop `onAddGroup` a `ResumenS10`
- Boton "Agregar sub-partida" visible debajo de cada partida en el resumen
- Conectado al handler `addGroup` existente en `presupuesto.tsx`

**Archivos modificados:**
- `src/components/sections/resumen-s10/resumen-s10.tsx` — nueva prop + boton UI
- `src/components/sections/presupuesto/presupuesto.tsx` — conexion del handler

---

### 1.3 Fix: Alineacion de numeros en tablas de resumen

**Problema:** En las tablas de Resumen S10, Partida Detail, Tipo Breakdown y Consolidado, los valores numericos no estaban centrados. Los headers heredaban `text-center` del base pero los datos usaban `text-right`, creando inconsistencia visual.

**Solucion:** Unificado a `text-center` en headers y datos de columnas numericas.

**Archivos modificados:**
- `src/components/sections/resumen-s10/resumen-s10.tsx` — Metrado, Subtotal, %
- `src/components/sections/partida-detail.tsx` — Metrado, C.Unit, C.Parcial
- `src/components/sections/resumen-s10/tipo-breakdown.tsx` — Costo, %
- `src/components/sections/resumen-s10/consolidated-table.tsx` — P.U., Cant., Costo
- `src/components/shared/metrado-cell.tsx` — justify-end → justify-center

---

## 2. Mejoras de Seguridad

### 2.1 Fix: Proteccion contra CSV Formula Injection

**Severidad:** MEDIA
**OWASP:** Injection

**Problema:** La funcion `escapeCSV()` en `export-budget.ts` no protegia contra inyeccion de formulas en Excel. Un valor como `=cmd|'/c calc'!A1` en una descripcion de item podria ejecutar comandos al abrir el CSV.

**Antes:**
```ts
// Solo escapaba comas, comillas y \n
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
```

**Despues:**
```ts
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function escapeCSV(value: string): string {
  let safe = value;
  if (FORMULA_PREFIXES.some((p) => safe.startsWith(p))) {
    safe = "'" + safe;  // neutraliza formulas en Excel/Sheets
  }
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}
```

**Archivo:** `src/lib/export-budget.ts`

---

### 2.2 Feature: Validacion de schema con Zod para localStorage

**Severidad:** MEDIA
**Riesgo mitigado:** Datos corruptos, prototype pollution, crashes por estado invalido

**Problema:** Los datos de localStorage se parseaban con `JSON.parse()` sin verificar estructura. Datos manipulados o corruptos podian causar crashes sin diagnostico.

**Solucion:**
- Instalado `zod@4.3.6`
- Creado `src/lib/schemas.ts` con schemas tipados:
  - `ProjectInfoSchema` (12 campos)
  - `NivelSchema` (6 campos)
  - `BudgetItemSchema`, `BudgetGroupSchema`, `BudgetSectionSchema` (jerarquia completa)
- Funcion helper `safeParse()` que retorna datos validados o `null` + warning
- Integrado en `loadProjects()` y `loadFloors()`

**Archivos:**
- `src/lib/schemas.ts` — NUEVO
- `src/lib/project-context.tsx` — usa safeParse
- `src/lib/floor-context.tsx` — usa safeParse

---

## 3. Mejoras de Calidad y Rendimiento

### 3.1 Fix: Catch blocks vacios reemplazados con logging

**Problema:** 5 bloques `catch {}` vacios en 3 archivos tragaban errores sin dejar rastro. Imposible diagnosticar problemas de persistencia.

**Solucion:** Todos los catch ahora usan `console.warn("[metrados] contexto: mensaje", error)` con prefijo consistente para filtrar en DevTools.

**Archivos:**
- `src/lib/project-context.tsx` — 2 catches (loadProjects, loadActiveId)
- `src/lib/floor-context.tsx` — 1 catch (loadFloors)
- `src/hooks/use-persistence.ts` — 2 catches (fetch load, fetch save)

---

### 3.2 Refactor: Eliminacion de duplicacion en budget-item-row.tsx

**Problema:** 142 lineas de JSX duplicadas entre el branch "con Factor" y "sin Factor". Mismas celdas de Delete, Description, Unit, CU linked y C.Parcial repetidas textualmente.

**Antes:** 177 lineas, 2 branches completos con `<Show when={hasFactor}>` que duplicaba toda la fila.

**Despues:** 120 lineas (-32%), una sola `<TableRow>` con `<Show>` condicionales solo en las celdas que difieren:
- Celda Factor: solo aparece cuando `hasFactor`
- Celda Metrado: logica unificada con Show interno
- Celda CU: col index viene de prop `cuCol`

**Archivo:** `src/components/sections/presupuesto/budget-item-row.tsx`

---

### 3.3 Optimizacion: Memoizacion de agregaciones por seccion

**Problema:** En columnas, vigas, losa y escalera, la logica de agregacion (volumenes, acero, encofrado por piso) estaba en `createEffect` que se re-ejecutaba en cada cambio de celda, recalculando TODO y llamando `publish()` como side-effect.

**Antes:**
```ts
createEffect(() => {
  // 30 lineas de calculo pesado
  publish("columnas", resultado);  // side-effect mezclado con calculo
});
```

**Despues:**
```ts
const columnasAgg = createMemo(() => {
  // 30 lineas de calculo (cacheado por SolidJS)
  return resultado;
});
createEffect(() => publish("columnas", columnasAgg()));
```

**Beneficio:**
- `createMemo` cachea resultado — si inputs no cambian, retorna cache
- `publish()` solo se ejecuta cuando el memo produce valor nuevo
- Separa computacion pura de side-effects (patron idomiatico SolidJS)

**Archivos:**
- `src/components/sections/columnas.tsx`
- `src/components/sections/vigas.tsx`
- `src/components/sections/losa.tsx`
- `src/components/sections/escalera.tsx`

---

## 4. Testing — Suite Completa de Tests Unitarios

### 4.1 Refactor: Extraccion de calcEscalera a modulo puro

**Problema:** `calcEscalera` vivia dentro de `escalera.tsx`, un componente SolidJS que importa `lucide-solid`, `Card`, `Table`, etc. Al intentar testearlo, Vitest fallaba con "Client-only API called on server side" porque lucide-solid ejecuta `template()` del DOM al importarse.

**Solucion:**
- Extraido `calcEscalera` a `src/components/sections/calc-escalera.ts` (modulo puro, sin dependencias UI)
- Re-exportado desde `escalera.tsx` con `export { calcEscalera } from "./calc-escalera"` para no romper imports existentes

**Archivos:**
- `src/components/sections/calc-escalera.ts` — NUEVO (funcion pura)
- `src/components/sections/escalera.tsx` — re-export + import local

---

### 4.2 Tests: calcMuro (muros-data)

**Archivo:** `src/data/__tests__/muros-data.test.ts`
**Tests:** 20

Cubre:
- Muro perimetral tipico (M-02): area bruta, descuento de viga, area existente, ladrillos, mortero, cemento, arena
- Muro con ventana (M-01): descuento de vanos + area existente
- Parapeto azotea (AZ-01): sin viga ni existente
- Tabique sin viga (T-07): altura completa
- Edge cases: area negativa clampeada a 0, existente > area, largo = 0
- Constantes REND: verificacion de los 4 rendimientos

---

### 4.3 Tests: calcEscalera (geometria de escalera)

**Archivo:** `src/components/sections/__tests__/calc-escalera.test.ts`
**Tests:** 31

Cubre:
- Geometria basica: pasos por tramo, altura, longitud horizontal, angulo theta, longitud inclinada, verificacion 2p+cp
- Volumen de concreto: espesor promedio, volumen tramo, volumen total, volumen descanso, rango razonable (1-5 m3)
- Encofrado: tramo, total tramos, descanso, total
- Acero 3/4" (longitudinal): numero de barras, longitud con empalme, varillas
- Acero 1/2" (bastones): longitud baston, metros totales, varillas
- Acero 3/8" (temperatura): barras por tramo, metros, total, varillas
- Variantes: nPasos impar (17), escalera angosta (0.80m)

---

### 4.4 Tests: escapeCSV (inyeccion de formulas)

**Archivo:** `src/lib/__tests__/export-budget.test.ts`
**Tests:** 16

Cubre:
- Valores normales: string simple, vacio, numeros
- Caracteres CSV: comas, comillas dobles, saltos de linea, retorno de carro
- Formula injection: prefijos `=`, `+`, `-`, `@`, `\t`, `\r` neutralizados con apostrofe
- Combinaciones: formula + coma, coma + comilla

---

### 4.5 Tests: Schemas Zod + safeParse

**Archivo:** `src/lib/__tests__/schemas.test.ts`
**Tests:** 20

Cubre:
- ProjectInfoSchema: datos validos, campo faltante, tipo incorrecto (fc como string)
- NivelSchema: datos validos, active como string, orden como string
- BudgetItemSchema: basico, con factor opcional, con insumoId opcional, m como string
- BudgetGroupSchema: valido, con campos opcionales, areaSource.type invalido, items vacio
- BudgetSectionSchema: valido, sin groups
- safeParse: retorna datos validos, null para invalidos, null para tipo incorrecto, log incluye label

---

### 4.6 Tests: budget-helpers (ampliacion)

**Archivo:** `src/lib/__tests__/budget-helpers.test.ts`
**Tests:** 29 (existian 14, agregados 15 nuevos)

Nuevos tests:
- `groupSubtotal`: suma m*cu, vacio retorna 0, decimales
- `classifyItem`: "MO ...", "mo ...", "Mano de obra ...", "mano de obra" exacto, materiales, string vacio
- `createFloorBudgetGroup`: nuevo id/cat/piso, reseteo de areaM2, conserva link/metradoUnit, items sin factor conservan metrado, items con factor resetean a 0, no muta source, areaM2 undefined

---

### 4.7 Tests: project-types (funciones de formato)

**Archivo:** `src/lib/__tests__/project-types.test.ts`
**Tests:** 9

Cubre:
- `getProjectLabel`: formato "floor — name"
- `getProjectSubtitle`: building, city, fc, fy, norm con separadores
- `getExportFilename`: slug correcto (csv, xlsx, pdf), caracteres especiales, trailing dash, espacios en floor
- `getPageTitle`: formato "Metrados — floor name"

---

## Deuda Tecnica Pendiente

Estas mejoras no se abordaron en esta sesion pero quedan identificadas:

| Item | Severidad | Descripcion |
|------|-----------|-------------|
| ~~Tests~~ | ~~ALTA~~ | ~~No hay tests unitarios ni e2e~~ **RESUELTO PARCIAL — 185 tests unitarios** |
| Tests de componentes | MEDIA | No hay tests de componentes SolidJS (render, interaccion) |
| Tests E2E | MEDIA | No hay Playwright/Cypress para flujos completos |
| CI/CD | ALTA | No hay pipeline de build/test automatizado |
| resumen-s10.tsx | MEDIA | ~400 lineas, candidato a refactorizar |
| overview.tsx | MEDIA | ~525 lineas, memos solapados, `any` en Chart.js callback |
| Error boundaries | MEDIA | No hay ErrorBoundary — un throw crashea toda la app |
| D1 migration | MEDIA | Solo localStorage, sin persistencia server-side real |
| Dynamic import errors | BAJA | xlsx/jspdf no tienen try-catch en el import |
| cellRefs leak | BAJA | use-spreadsheet-grid.ts no limpia refs de celdas eliminadas |

---

## Metricas de Impacto

| Metrica | Antes | Despues |
|---------|-------|---------|
| Test suites | 3 | 9 (+6) |
| Tests unitarios | 60 | 185 (+125) |
| Funciones testeadas | 3 | 14 (+11) |
| Lineas budget-item-row.tsx | 177 | 120 (-32%) |
| Catch blocks vacios | 5 | 0 |
| CSV injection protegido | No | Si |
| Schema validation | Ninguna | Zod en projects + floors |
| Agregaciones memoizadas | 0/4 secciones | 4/4 secciones |
| Bundle size (main chunk) | 468 KB | 534 KB (+66 KB por Zod) |

---

## Cobertura de Tests por Modulo

| Modulo | Archivo Test | Tests | Funciones Cubiertas |
|--------|-------------|-------|---------------------|
| Undo/Redo | `use-undo-redo.test.ts` | 15 | useUndoRedo (push, undo, redo, limits) |
| Utilidades | `utils.test.ts` | 11 | cn, fmtS, fmtN |
| Budget Formulas | `budget-formulas.test.ts` | 34 | resolveFormula, formulas por seccion |
| Budget Helpers | `budget-helpers.test.ts` | 29 | flatGroups, updateGroup, groupSubtotal, classifyItem, createFloorBudgetGroup |
| Muros | `muros-data.test.ts` | 20 | calcMuro, REND constants |
| Escalera | `calc-escalera.test.ts` | 31 | calcEscalera (geometria, volumen, encofrado, acero) |
| Export CSV | `export-budget.test.ts` | 16 | escapeCSV (injection, quoting) |
| Schemas | `schemas.test.ts` | 20 | 5 schemas Zod + safeParse |
| Project Types | `project-types.test.ts` | 9 | getProjectLabel, getProjectSubtitle, getExportFilename, getPageTitle |
| **TOTAL** | **9 suites** | **185** | **14 funciones / 5 schemas** |
