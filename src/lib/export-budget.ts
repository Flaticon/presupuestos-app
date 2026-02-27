import type { BudgetSection } from "@/lib/types";
import type { Insumo } from "@/data/insumos-data";
import type { Nivel } from "@/lib/types";
import type { ProjectInfo } from "@/lib/project-types";
import { getExportFilename } from "@/lib/project-types";
import { flatGroups } from "@/lib/budget-helpers";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function exportBudgetCSV(budget: BudgetSection[], project: ProjectInfo) {
  const rows: string[] = [];
  rows.push("Partida,Descripción,Und.,Metrado,C.Unitario,C.Parcial");

  let grandTotal = 0;

  for (const section of budget) {
    // Section header row
    rows.push(`${escapeCSV(section.title)},,,,,`);

    for (const group of section.groups) {
      // Group header row
      rows.push(`  ${escapeCSV(group.cat)},,,,,`);

      let subtotal = 0;
      for (const item of group.items) {
        const parcial = item.m * item.cu;
        subtotal += parcial;
        rows.push(
          `,${escapeCSV(item.d)},${escapeCSV(item.u)},${item.m},${item.cu},${parcial.toFixed(2)}`
        );
      }

      rows.push(`,,,,,${subtotal.toFixed(2)}`);
      grandTotal += subtotal;
    }
  }

  rows.push(`,,,,TOTAL GENERAL,${grandTotal.toFixed(2)}`);

  // UTF-8 BOM for Excel compatibility with accented characters
  const BOM = "\uFEFF";
  const csvContent = BOM + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getExportFilename(project, "csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportBudgetXLS(budget: BudgetSection[], project: ProjectInfo) {
  const rows: (string | number)[][] = [];
  rows.push(["Partida", "Descripción", "Und.", "Metrado", "C.Unitario", "C.Parcial"]);

  let grandTotal = 0;

  for (const section of budget) {
    // Section header
    rows.push([section.title, "", "", "", "", ""]);

    for (const group of section.groups) {
      rows.push([`  ${group.cat}`, "", "", "", "", ""]);

      let subtotal = 0;
      for (const item of group.items) {
        const parcial = item.m * item.cu;
        subtotal += parcial;
        rows.push(["", item.d, item.u, item.m, item.cu, Math.round(parcial * 100) / 100]);
      }

      rows.push(["", "", "", "", "Subtotal", Math.round(subtotal * 100) / 100]);
      grandTotal += subtotal;
    }
  }

  rows.push(["", "", "", "", "TOTAL GENERAL", Math.round(grandTotal * 100) / 100]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Presupuesto");
  XLSX.writeFile(wb, getExportFilename(project, "xlsx"));
}

export function exportBudgetPDF(budget: BudgetSection[], project: ProjectInfo) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const pdfTitle = `PRESUPUESTO — ${project.name} ${project.floor}`;
  doc.text(pdfTitle, 105, 18, { align: "center" });

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const pdfSub = project.engineer
    ? `Ing. ${project.engineer}${project.cip ? `  CIP ${project.cip}` : ""}`
    : project.city;
  doc.text(pdfSub, 105, 25, { align: "center" });

  const body: (string | { content: string; styles?: Record<string, unknown> })[][] = [];
  let grandTotal = 0;

  for (const section of budget) {
    // Section header row
    body.push([
      { content: section.title, styles: { fontStyle: "bold", fillColor: [15, 23, 42], textColor: [255, 255, 255], cellWidth: "wrap" } },
      { content: "", styles: { fillColor: [15, 23, 42] } },
      { content: "", styles: { fillColor: [15, 23, 42] } },
      { content: "", styles: { fillColor: [15, 23, 42] } },
      { content: "", styles: { fillColor: [15, 23, 42] } },
    ]);

    for (const group of section.groups) {
      // Group header row
      body.push([
        { content: group.cat, styles: { fontStyle: "bold", fillColor: [232, 234, 246], cellWidth: "wrap" } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
      ]);

      let subtotal = 0;
      for (const item of group.items) {
        const parcial = item.m * item.cu;
        subtotal += parcial;
        body.push([
          item.d,
          item.u,
          item.m.toString(),
          item.cu.toFixed(2),
          parcial.toFixed(2),
        ]);
      }

      // Subtotal row
      body.push([
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: "Subtotal", styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } },
        { content: subtotal.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } },
      ]);
      grandTotal += subtotal;
    }
  }

  // Grand total row
  body.push([
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "TOTAL GENERAL", styles: { fontStyle: "bold", halign: "right", fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: grandTotal.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["Descripción", "Und.", "Metrado", "C.Unitario", "C.Parcial"]],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  doc.save(getExportFilename(project, "pdf"));
}

function classifyItemForExport(d: string): "mano-de-obra" | "material" {
  const dl = d.toLowerCase();
  if (dl.startsWith("mo ") || dl.startsWith("mano de obra") || dl === "mano de obra") return "mano-de-obra";
  return "material";
}

export function exportInsumosPDF(
  budget: BudgetSection[],
  insumos: Insumo[],
  floors: Nivel[],
  project: ProjectInfo,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const insumoMap = new Map(insumos.map((i) => [i.id, i]));
  const floorMap = new Map(floors.map((f) => [f.id, f]));

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`INSUMOS POR PISO — ${project.name} ${project.floor}`, 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const pdfSub = project.engineer
    ? `Ing. ${project.engineer}${project.cip ? `  CIP ${project.cip}` : ""}`
    : project.city;
  doc.text(pdfSub, 105, 25, { align: "center" });

  // Flatten to BudgetGroup[] for piso grouping
  const allGroups = flatGroups(budget);

  // Group budget by piso
  const pisoGroups = new Map<string, typeof allGroups>();
  for (const g of allGroups) {
    const p = g.piso ?? "sin-piso";
    if (!pisoGroups.has(p)) pisoGroups.set(p, []);
    pisoGroups.get(p)!.push(g);
  }

  type CellContent = string | { content: string; styles?: Record<string, unknown> };
  const body: CellContent[][] = [];
  let grandTotal = 0;

  const groupLabels: Record<string, string> = {
    material: "Materiales",
    "mano-de-obra": "Mano de Obra",
    equipo: "Equipos",
  };
  const groupOrder = ["material", "mano-de-obra", "equipo"] as const;

  for (const [pisoId, groups] of pisoGroups) {
    const floor = floorMap.get(pisoId);
    const pisoLabel = floor?.label ?? pisoId;

    // Piso header
    body.push([
      { content: pisoLabel.toUpperCase(), styles: { fontStyle: "bold", fillColor: [30, 41, 59], textColor: [255, 255, 255], cellWidth: "wrap" } },
      { content: "", styles: { fillColor: [30, 41, 59] } },
      { content: "", styles: { fillColor: [30, 41, 59] } },
      { content: "", styles: { fillColor: [30, 41, 59] } },
      { content: "", styles: { fillColor: [30, 41, 59] } },
    ]);

    // Consolidate insumos for this piso
    interface Entry {
      key: string;
      nombre: string;
      unidad: string;
      pu: number;
      cantTotal: number;
      grupo: "material" | "mano-de-obra" | "equipo";
    }
    const consolidated = new Map<string, Entry>();

    for (const g of groups) {
      for (const it of g.items) {
        if (it.insumoId) {
          const ins = insumoMap.get(it.insumoId);
          if (!ins) continue;
          const existing = consolidated.get(it.insumoId);
          if (existing) {
            existing.cantTotal += it.m;
          } else {
            consolidated.set(it.insumoId, {
              key: it.insumoId,
              nombre: ins.nombre,
              unidad: ins.unidad,
              pu: ins.precio,
              cantTotal: it.m,
              grupo: ins.grupo,
            });
          }
        } else {
          const uniqueKey = `_${g.cat}_${it.d}`;
          consolidated.set(uniqueKey, {
            key: uniqueKey,
            nombre: `${it.d} (${g.cat})`,
            unidad: it.u,
            pu: it.cu,
            cantTotal: it.m,
            grupo: classifyItemForExport(it.d) === "mano-de-obra" ? "mano-de-obra" : "material",
          });
        }
      }
    }

    const entries = Array.from(consolidated.values());
    let pisoTotal = 0;

    for (const grupo of groupOrder) {
      const groupEntries = entries.filter((e) => e.grupo === grupo);
      if (groupEntries.length === 0) continue;

      // Group sub-header
      body.push([
        { content: `  ${groupLabels[grupo]}`, styles: { fontStyle: "bold", fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
        { content: "", styles: { fillColor: [232, 234, 246] } },
      ]);

      let groupSub = 0;
      for (const e of groupEntries) {
        const cost = e.cantTotal * e.pu;
        groupSub += cost;
        body.push([e.nombre, e.unidad, e.pu.toFixed(2), e.cantTotal.toFixed(2), cost.toFixed(2)]);
      }

      body.push([
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: "", styles: { fillColor: [245, 245, 245] } },
        { content: `Sub. ${groupLabels[grupo]}`, styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } },
        { content: groupSub.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } },
      ]);
      pisoTotal += groupSub;
    }

    // Piso subtotal
    body.push([
      { content: "", styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] } },
      { content: "", styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] } },
      { content: "", styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] } },
      { content: `Total ${pisoLabel}`, styles: { fontStyle: "bold", halign: "right", fillColor: [51, 65, 85], textColor: [255, 255, 255] } },
      { content: pisoTotal.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [51, 65, 85], textColor: [255, 255, 255] } },
    ]);

    grandTotal += pisoTotal;
  }

  // Grand total
  body.push([
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: "GRAN TOTAL", styles: { fontStyle: "bold", halign: "right", fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
    { content: grandTotal.toFixed(2), styles: { fontStyle: "bold", halign: "right", fillColor: [21, 128, 61], textColor: [255, 255, 255] } },
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["Insumo", "Und.", "P.U.", "Cant.", "Costo"]],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const floor = project.floor.replace(/\s+/g, "");
  doc.save(`insumos-${slug}-${floor}.pdf`);
}
