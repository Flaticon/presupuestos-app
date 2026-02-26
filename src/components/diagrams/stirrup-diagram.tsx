export function StirrupDiagram() {
  return (
    <div className="bg-muted/70 rounded-xl border border-border px-3.5 py-2.5 font-mono text-xs leading-relaxed my-2">
      <b className="text-text text-xs">ESTRIBOS — Distribución (NTE E.060 Cap.21)</b>
      <br />
      <span className="text-steel-38">Zona confinada (2×Lo c/extremo):</span>{" "}
      <b>1@0.05 + n@0.10</b> &nbsp;·&nbsp; Lo = máx(d, Ln/6, 0.50)
      <br />
      <span className="text-text-mid">Zona central:</span> <b>@0.20</b>
      <br />
      Long/estribo:{" "}
      <span className="text-steel-38">30×50 → 1.48m</span> &nbsp;·&nbsp;{" "}
      <span className="text-steel-38">30×60 → 1.68m</span>
    </div>
  );
}
