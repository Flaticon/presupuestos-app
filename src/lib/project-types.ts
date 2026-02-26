export interface ProjectInfo {
  id: string;
  name: string;
  building: string;
  floor: string;
  city: string;
  engineer: string;
  cip: string;
  fc: number;
  fy: number;
  norm: string;
  createdAt: string;
  updatedAt: string;
}

export function getProjectLabel(p: ProjectInfo): string {
  return `${p.floor} — ${p.name}`;
}

export function getProjectSubtitle(p: ProjectInfo): string {
  return `${p.building} · ${p.city} · f'c=${p.fc} · fy=${p.fy} · ${p.norm}`;
}

export function getExportFilename(p: ProjectInfo, ext: string): string {
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const floor = p.floor.replace(/\s+/g, "");
  return `presupuesto-${slug}-${floor}.${ext}`;
}

export function getPageTitle(p: ProjectInfo): string {
  return `Metrados — ${p.floor} ${p.name}`;
}
