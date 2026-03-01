import type { EscaleraGeo } from "@/lib/types";

const ZERO_RESULT = {
  valid: false as const,
  pasosTramo: 0, hTramo: 0, lHoriz: 0, theta: 0, cosT: 1, lIncl: 0,
  eProm: 0, vTramo: 0, vTramos: 0, vDesc: 0, vTotal: 0,
  encTramo: 0, encTramos: 0, encDesc: 0, encTotal: 0,
  n34: 0, l34: 0, m34tramo: 0, n34desc: 0, m34desc: 0, m34total: 0, v34: 0,
  n12: 0, lnBaston: 0, m12total: 0, v12: 0,
  n38tramo: 0, m38tramo: 0, n38desc: 0, m38desc: 0, m38total: 0, v38: 0,
  verif: 0,
};

export type EscaleraResult = ReturnType<typeof calcEscalera>;

export function calcEscalera(geo: EscaleraGeo) {
  const pasosTramo = Math.floor(geo.nPasos / 2);
  if (pasosTramo <= 0 || geo.p <= 0) return { ...ZERO_RESULT, verif: 2 * geo.p + geo.cp };

  const hTramo = pasosTramo * geo.cp;
  const lHoriz = pasosTramo * geo.p;
  const theta = Math.atan(hTramo / lHoriz);
  const cosT = Math.cos(theta);
  if (cosT === 0) return { ...ZERO_RESULT, verif: 2 * geo.p + geo.cp };
  const lIncl = Math.sqrt(lHoriz ** 2 + hTramo ** 2);

  const eProm = geo.garganta / cosT + geo.cp / 2;
  const vTramo = geo.ancho * lHoriz * eProm;
  const vTramos = vTramo * 2;
  const vDesc = geo.anchoTotal * geo.descL * geo.eDesc;
  const vTotal = vTramos + vDesc;

  const encTramo = geo.ancho * lIncl;
  const encTramos = encTramo * 2;
  const encDesc = geo.anchoTotal * geo.descL;
  const encTotal = encTramos + encDesc;

  const n34 = Math.floor(geo.ancho / geo.sep34) + 1;
  const l34 = lIncl + 2 * 0.40;
  const m34tramo = n34 * l34;
  const n34desc = Math.floor(geo.anchoTotal / geo.sep34) + 1;
  const m34desc = n34desc * (geo.descL + 0.40);
  const m34total = m34tramo * 2 + m34desc;
  const v34 = Math.ceil(m34total / 9);

  const n12 = Math.floor(geo.ancho / geo.sep12) + 1;
  const lnBaston = lHoriz * 0.25 + 0.40;
  const m12total = n12 * lnBaston * 4;
  const v12 = Math.ceil(m12total / 9);

  const n38tramo = Math.floor(lIncl / geo.sep38) + 1;
  const m38tramo = n38tramo * geo.ancho;
  const n38desc = Math.floor(geo.descL / geo.sep38) + 1;
  const m38desc = n38desc * geo.anchoTotal;
  const m38total = m38tramo * 2 + m38desc;
  const v38 = Math.ceil(m38total / 9);

  const verif = 2 * geo.p + geo.cp;

  return {
    valid: true as const,
    pasosTramo, hTramo, lHoriz, theta, cosT, lIncl,
    eProm, vTramo, vTramos, vDesc, vTotal,
    encTramo, encTramos, encDesc, encTotal,
    n34, l34, m34tramo, n34desc, m34desc, m34total, v34,
    n12, lnBaston, m12total, v12,
    n38tramo, m38tramo, n38desc, m38desc, m38total, v38,
    verif,
  };
}
