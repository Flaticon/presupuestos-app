import type { BudgetGroup } from "@/lib/types";
import type { ProjectInfo } from "@/lib/project-types";
import { getExportFilename } from "@/lib/project-types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function exportBudgetCSV(budget: BudgetGroup[], project: ProjectInfo) {
  const rows: string[] = [];
  rows.push("Partida,Descripción,Und.,Metrado,C.Unitario,C.Parcial");

  let grandTotal = 0;

  for (const group of budget) {
    // Category header row
    rows.push(`${escapeCSV(group.cat)},,,,,`);

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

export function exportBudgetXLS(budget: BudgetGroup[], project: ProjectInfo) {
  const rows: (string | number)[][] = [];
  rows.push(["Partida", "Descripción", "Und.", "Metrado", "C.Unitario", "C.Parcial"]);

  let grandTotal = 0;

  for (const group of budget) {
    rows.push([group.cat, "", "", "", "", ""]);

    let subtotal = 0;
    for (const item of group.items) {
      const parcial = item.m * item.cu;
      subtotal += parcial;
      rows.push(["", item.d, item.u, item.m, item.cu, Math.round(parcial * 100) / 100]);
    }

    rows.push(["", "", "", "", "Subtotal", Math.round(subtotal * 100) / 100]);
    grandTotal += subtotal;
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

export function exportBudgetPDF(budget: BudgetGroup[], project: ProjectInfo) {
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

  for (const group of budget) {
    // Category header row
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
