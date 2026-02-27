import type { BudgetSection } from "@/lib/types";

export const BUDGET_INIT: BudgetSection[] = [
  // ── 1. TRABAJOS PRELIMINARES ──
  {
    id: "sec-trab-prelim",
    title: "1. TRABAJOS PRELIMINARES",
    groups: [
      {
        id: "trab-prelim",
        cat: "1.1 TRABAJOS PRELIMINARES",
        piso: "3er-piso",
        items: [
          { d: "Desmontaje cobertura metálica", u: "Gbl.", m: 1, cu: 900 },
          { d: "Desmontaje teatina", u: "m²", m: 28, cu: 35 },
          { d: "Limpieza general", u: "Gbl.", m: 1, cu: 800 },
          { d: "Demolición ampliaciones", u: "Gbl.", m: 1, cu: 800 },
          { d: "Demolición falsas columnas", u: "Gbl.", m: 12, cu: 200 },
          { d: "Demolición columnas hasta 2.5m", u: "Gbl.", m: 14, cu: 300 },
          { d: "MO demolición", u: "Gbl.", m: 1, cu: 800 },
          { d: "Apuntalamiento techo escalera", u: "m²", m: 2.6, cu: 140 },
          { d: "Demolición techo escalera", u: "Gbl.", m: 1, cu: 1500 },
          { d: "MO apuntalamiento", u: "Gbl.", m: 1, cu: 500 },
          { d: "Demolición contrapiso", u: "m²", m: 110.8, cu: 20 },
          { d: "MO demolición contrapiso", u: "Gbl.", m: 1, cu: 800 },
          { d: "Desmontaje tanque Rotoplas", u: "Gbl.", m: 1, cu: 1100 },
          { d: "Soporte provisional tanque", u: "Gbl.", m: 1, cu: 950 },
          { d: "MO reubicación tanque", u: "Gbl.", m: 1, cu: 750 },
          { d: "Acarreo desmonte", u: "m³", m: 35, cu: 25 },
          { d: "Eliminación desmonte", u: "m³", m: 30, cu: 25 },
        ],
      },
    ],
  },

  // ── 2. OBRAS DE CONCRETO ARMADO ──
  {
    id: "sec-concreto",
    title: "2. OBRAS DE CONCRETO ARMADO",
    groups: [
      {
        id: "contrapiso-3p",
        cat: "2.1 CONTRAPISO e=0.05m",
        piso: "3er-piso",
        link: "contrapiso",
        areaM2: 294,
        areaSource: { type: "manual", nota: "Área de contrapiso 3P" },
        items: [
          { d: "Cemento", u: "Bls.", m: 102.9, cu: 34.30, insumoId: "cem-contr" },
          { d: "Agregados", u: "m³", m: 14.7, cu: 95 },
          { d: "Mano de obra", u: "m²", m: 294, cu: 18, factor: 1, insumoId: "mo-contr" },
        ],
      },
      {
        id: "columnas-3p",
        cat: "2.2 COLUMNAS f'c=210",
        piso: "3er-piso",
        link: "columnas",
        areaM2: 18.05,
        metradoUnit: "m³",
        areaSource: { type: "auto", nota: "Volumen de columnas: Σ(b×h×H×n)" },
        items: [
          { d: "Cemento", u: "Bls.", m: 162.45, cu: 33, factor: 9, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 9.39, cu: 49.15, factor: 0.52, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 9.57, cu: 55.08, factor: 0.53, insumoId: "grav" },
          { d: 'Acero Ø3/4"', u: "Vlla.", m: 27, cu: 78.50, insumoId: "ace-34" },
          { d: 'Acero Ø5/8"', u: "Vlla.", m: 55, cu: 53.50, insumoId: "ace-58" },
          { d: "Alambre amarre", u: "Kg.", m: 25, cu: 7.20 },
          { d: "Clavos", u: "Kg.", m: 25, cu: 5.51 },
          { d: "MO columnas", u: "Gbl.", m: 1, cu: 3000, insumoId: "mo-col" },
        ],
      },
      {
        id: "vigas-3p",
        cat: "2.3 VIGAS f'c=210",
        piso: "3er-piso",
        link: "vigas",
        areaM2: 25.0,
        metradoUnit: "m³",
        areaSource: { type: "auto", nota: "Volumen de vigas: Σ(b×h×Lt)" },
        items: [
          { d: "Cemento", u: "Bls.", m: 225, cu: 33, factor: 9, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 13, cu: 49.15, factor: 0.52, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 13.25, cu: 55.08, factor: 0.53, insumoId: "grav" },
          { d: 'Acero Ø3/4"', u: "Vlla.", m: 75, cu: 78.50, insumoId: "ace-34" },
          { d: 'Acero Ø5/8"', u: "Vlla.", m: 40, cu: 53.50, insumoId: "ace-58" },
          { d: 'Acero Ø1/2"', u: "Vlla.", m: 7, cu: 32.08, insumoId: "ace-12" },
          { d: 'Acero Ø3/8"', u: "Vlla.", m: 228, cu: 18.27, insumoId: "ace-38" },
          { d: "Alambre+clavos", u: "Gbl.", m: 1, cu: 381, insumoId: "alam-clav" },
          { d: "MO vigas", u: "Gbl.", m: 1, cu: 15500, insumoId: "mo-vig" },
        ],
      },
      {
        id: "losa-3p",
        cat: "2.4 LOSA ALIGERADA",
        piso: "3er-piso",
        link: "losa",
        areaM2: 15.0,
        metradoUnit: "m³",
        areaSource: { type: "auto", nota: "Volumen de losa: Σ vol paños" },
        items: [
          { d: "Cemento", u: "Bls.", m: 135, cu: 33, factor: 9, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 7.8, cu: 49.15, factor: 0.52, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 7.95, cu: 55.08, factor: 0.53, insumoId: "grav" },
          { d: "Ladrillo techo", u: "Und.", m: 1672, cu: 2.50, insumoId: "lad-tech" },
          { d: 'Acero Ø1/2"', u: "Vlla.", m: 98, cu: 32.08, insumoId: "ace-12" },
          { d: 'Acero Ø3/8"', u: "Vlla.", m: 25, cu: 18.27, insumoId: "ace-38" },
          { d: 'Acero Ø1/4"', u: "Vlla.", m: 92, cu: 5.60, insumoId: "ace-14" },
          { d: "Alambre+clavos", u: "Gbl.", m: 1, cu: 381, insumoId: "alam-clav" },
          { d: "MO losa", u: "Gbl.", m: 1, cu: 7500, insumoId: "mo-los" },
        ],
      },
      {
        id: "escalera-3p",
        cat: "2.5 ESCALERA",
        piso: "3er-piso",
        link: "escalera",
        areaM2: 2.5,
        metradoUnit: "m³",
        areaSource: { type: "auto", nota: "Volumen de escalera: tramos+descanso" },
        items: [
          { d: "Cemento", u: "Bls.", m: 22.5, cu: 33, factor: 9, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 1.3, cu: 49.15, factor: 0.52, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 1.33, cu: 55.08, factor: 0.53, insumoId: "grav" },
          { d: 'Acero Ø3/4"', u: "Vlla.", m: 12, cu: 78.50, insumoId: "ace-34" },
          { d: 'Acero Ø1/2"', u: "Vlla.", m: 8, cu: 32.08, insumoId: "ace-12" },
          { d: 'Acero Ø3/8"', u: "Vlla.", m: 18, cu: 18.27, insumoId: "ace-38" },
          { d: "Encofrado escalera", u: "Gbl.", m: 1, cu: 3500 },
          { d: "MO escalera", u: "Gbl.", m: 1, cu: 4500, insumoId: "mo-esc" },
        ],
      },
      {
        id: "muros-3p",
        cat: "2.6 MUROS Y TABIQUERÍA",
        piso: "3er-piso",
        link: "muros",
        areaM2: 72.2,
        areaSource: { type: "manual", nota: "Área de muros a asentar" },
        items: [
          { d: "Ladrillo KK 18 huecos", u: "Und.", m: 2816, cu: 0.90, insumoId: "lad-kk" },
          { d: "Cemento", u: "Bls.", m: 18.5, cu: 33, insumoId: "cem-c210" },
          { d: "Arena gruesa", u: "m³", m: 2.67, cu: 49.15, insumoId: "are-gru" },
          { d: "MO asentado de ladrillo", u: "m²", m: 72.2, cu: 30, factor: 1, insumoId: "mo-asen" },
        ],
      },
    ],
  },

  // ── 3. REBOQUES Y ENLUCIDOS ──
  {
    id: "sec-reboques",
    title: "3. REBOQUES Y ENLUCIDOS",
    groups: [
      {
        id: "tarrajeo-ie",
        cat: "3.1 TARRAJEO INTERIOR Y EXTERIOR",
        piso: "3er-piso",
        areaM2: 406.22,
        areaSource: { type: "auto", nota: "Muros 3P: área bruta × 2 caras" },
        items: [
          { d: "Cemento", u: "Bls.", m: 56.87, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 8.12, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 3600, insumoId: "mo-tarr-ie" },
        ],
      },
      {
        id: "tarrajeo-vigas",
        cat: "3.2 TARRAJEO DE VIGAS",
        piso: "3er-piso",
        areaM2: 93.06,
        areaSource: { type: "auto", nota: "Vigas: perímetro expuesto × longitud" },
        items: [
          { d: "Cemento", u: "Bls.", m: 13.03, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 1.86, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 3340, insumoId: "mo-tarr-vig" },
        ],
      },
      {
        id: "tarrajeo-col",
        cat: "3.3 TARRAJEO DE COLUMNAS",
        piso: "3er-piso",
        areaM2: 103.97,
        areaSource: { type: "auto", nota: "Columnas: perímetro × altura × cantidad" },
        items: [
          { d: "Cemento", u: "Bls.", m: 14.56, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 2.08, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 1080, insumoId: "mo-tarr-col" },
        ],
      },
      {
        id: "derrames",
        cat: "3.4 DERRAMES",
        piso: "3er-piso",
        areaM2: 50.81,
        areaSource: { type: "manual", nota: "Marcos de puertas/ventanas — solo manual" },
        items: [
          { d: "Cemento", u: "Bls.", m: 7.11, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 1.02, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 1050, insumoId: "mo-tarr-der" },
        ],
      },
      {
        id: "revest-escalera",
        cat: "3.5 REVESTIMIENTO ESCALERA",
        piso: "3er-piso",
        areaM2: 11.78,
        areaSource: { type: "auto", nota: "Escalera: área encofrado" },
        items: [
          { d: "Cemento", u: "Bls.", m: 1.88, cu: 17.35, factor: 0.16, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 0.24, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 900, insumoId: "mo-tarr-esc" },
        ],
      },
      {
        id: "cieloraso-3p",
        cat: "3.6 CIELORASO",
        piso: "3er-piso",
        areaM2: 278.49,
        areaSource: { type: "auto", nota: "Losa aligerada + maciza" },
        items: [
          { d: "Cemento", u: "Bls.", m: 44.56, cu: 17.35, factor: 0.16, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 5.57, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 4074, insumoId: "mo-ciel" },
        ],
      },
    ],
  },

  // ── 4. PISOS ──
  {
    id: "sec-pisos",
    title: "4. PISOS",
    groups: [
      {
        id: "piso-at",
        cat: "4.1 PISO ALTO TRÁNSITO",
        piso: "3er-piso",
        items: [
          { d: "Piso altotránsito con pegamento y fragua", u: "m²", m: 313.66, cu: 42.34 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 3760.80, insumoId: "mo-piso" },
        ],
      },
      {
        id: "acabado-esc",
        cat: "4.2 ACABADO ESCALERA",
        piso: "3er-piso",
        items: [
          { d: "Acabado escalera con pegamento y fragua", u: "m²", m: 15.63, cu: 42.34 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 1200, insumoId: "mo-piso-esc" },
        ],
      },
    ],
  },

  // ── 5. ZÓCALOS Y CONTRAZÓCALOS ──
  {
    id: "sec-zocalos",
    title: "5. ZÓCALOS Y CONTRAZÓCALOS",
    groups: [
      {
        id: "zocalos",
        cat: "5. ZÓCALOS Y CONTRAZÓCALOS",
        piso: "3er-piso",
        items: [
          { d: "Enchapes de baños con pegamento y fragua", u: "m²", m: 55.25, cu: 36.90 },
          { d: "MO enchapes", u: "Gbl.", m: 1, cu: 960, insumoId: "mo-ench" },
          { d: "Contrazócalos cerámica con peg. y fragua", u: "m", m: 158.78, cu: 15.68 },
          { d: "MO contrazócalos", u: "Gbl.", m: 1, cu: 1160, insumoId: "mo-czoc" },
        ],
      },
    ],
  },

  // ── 6. INST. SANITARIAS ──
  {
    id: "sec-sanitarias",
    title: "6. INST. SANITARIAS",
    groups: [
      {
        id: "inst-sanitarias",
        cat: "6. INSTALACIONES DE AGUA FRÍA Y DESAGÜE",
        piso: "3er-piso",
        items: [
          { d: 'Puntos de agua fría PVC 1/2"', u: "Pto.", m: 7, cu: 47.50 },
          { d: 'Red de distribución PVC 1/2" y 3/4"', u: "Ml.", m: 13, cu: 35.50 },
          { d: 'Válvulas de interrupción 1/2"', u: "Und.", m: 2, cu: 65.00 },
          { d: "Puntos de desagüe", u: "Pto.", m: 7, cu: 52.00 },
          { d: 'Bajada de desagüe 4"', u: "Und.", m: 3, cu: 75.70 },
          { d: "Tubería de ventilación", u: "Und.", m: 2, cu: 54.60 },
          { d: 'Sumidero de 3"', u: "Und.", m: 2, cu: 39.30 },
          { d: 'Registro roscado 4"', u: "Und.", m: 2, cu: 46.45 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 1340, insumoId: "mo-san" },
        ],
      },
    ],
  },

  // ── 7. APARATOS SANITARIOS ──
  {
    id: "sec-aparatos",
    title: "7. APARATOS SANITARIOS",
    groups: [
      {
        id: "aparatos-san",
        cat: "7. APARATOS SANITARIOS",
        piso: "3er-piso",
        items: [
          { d: "Inodoro y accesorios", u: "Und.", m: 2, cu: 375.60 },
          { d: "Urinario y accesorios", u: "Und.", m: 2, cu: 279.70 },
          { d: "Lavatorios y accesorios", u: "Und.", m: 3, cu: 265.70 },
          { d: "Llave temporizadora para urinario", u: "Und.", m: 2, cu: 195.85 },
          { d: "Llave temporizadora para lavatorio", u: "Und.", m: 3, cu: 185.85 },
          { d: "Accesorios de baño", u: "Und.", m: 2, cu: 145.80 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 350, insumoId: "mo-apar" },
        ],
      },
    ],
  },

  // ── 8. INST. ELÉCTRICAS ──
  {
    id: "sec-electricas",
    title: "8. INST. ELÉCTRICAS",
    groups: [
      {
        id: "inst-electricas",
        cat: "8. INSTALACIONES ELÉCTRICAS SIN LUMINARIAS",
        piso: "3er-piso",
        items: [
          { d: "Puntos de luz con interruptor", u: "Pto.", m: 30, cu: 82.45 },
          { d: "Puntos de luz con interruptor conmutación", u: "Pto.", m: 2, cu: 95.76 },
          { d: "Tomacorrientes dobles c/ puesta a tierra", u: "Und.", m: 14, cu: 65.40 },
          { d: "Tomacorrientes dobles c/ PT prueba ácida", u: "Und.", m: 2, cu: 71.70 },
          { d: "Tomac. dobles c/ PT prueba ácida en piso", u: "Und.", m: 4, cu: 79.50 },
          { d: "Salida para teléfono", u: "Pto.", m: 1, cu: 115.80 },
          { d: "Salida para intercomunicador", u: "Pto.", m: 2, cu: 68.50 },
          { d: "Salida para extractor de aire", u: "Pto.", m: 2, cu: 78.00 },
          { d: "Salida para detector de humo", u: "Pto.", m: 2, cu: 78.00 },
          { d: "Salida para luminaria de emergencia", u: "Pto.", m: 7, cu: 78.00 },
          { d: "Salida para alarma acústica", u: "Pto.", m: 1, cu: 78.00 },
          { d: "Salida para cámara de seguridad s/ cable", u: "Pto.", m: 2, cu: 55.00 },
          { d: "Salida intercomunicador s/ cableado", u: "Pto.", m: 2, cu: 55.00 },
          { d: "Salida para internet", u: "Pto.", m: 1, cu: 115.80 },
          { d: "Tablero termomagnético", u: "Und.", m: 2, cu: 450.00 },
          { d: "Acometida general con cajas de pase", u: "Ml.", m: 6.80, cu: 35.00 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 2400, insumoId: "mo-elec" },
        ],
      },
    ],
  },

  // ── 9. CARPINTERÍA MADERA ──
  {
    id: "sec-carp-madera",
    title: "9. CARPINTERÍA MADERA",
    groups: [
      {
        id: "carp-madera",
        cat: "9. CARPINTERÍA DE MADERA",
        piso: "3er-piso",
        items: [
          { d: "Puerta madera, marco 2\"x3\" 0.7×2.1 1 hoja", u: "Und.", m: 2, cu: 295.40 },
        ],
      },
    ],
  },

  // ── 10. CARPINTERÍA METÁLICA ──
  {
    id: "sec-carp-metalica",
    title: "10. CARPINTERÍA METÁLICA",
    groups: [
      {
        id: "carp-metalica",
        cat: "10. CARPINTERÍA METÁLICA",
        piso: "3er-piso",
        items: [
          { d: "Puerta metálica cortafuego", u: "Und.", m: 2, cu: 1200 },
          { d: "Puerta metálica de seguridad", u: "Und.", m: 2, cu: 850 },
          { d: "Baranda escalera y pasadizo", u: "Und.", m: 1, cu: 3500 },
          { d: "Farola patio distribución", u: "Und.", m: 1, cu: 7500 },
        ],
      },
    ],
  },

  // ── 11. CERRAJERÍA ──
  {
    id: "sec-cerrajeria",
    title: "11. CERRAJERÍA",
    groups: [
      {
        id: "cerrajeria",
        cat: "11. CERRAJERÍA",
        piso: "3er-piso",
        items: [
          { d: "Cerradura puerta FORTE 3 golpes", u: "Und.", m: 2, cu: 90.00 },
          { d: "Cerradura simple puerta", u: "Und.", m: 2, cu: 30.00 },
          { d: 'Bisagras capuchinas aluminizadas 3"×3"', u: "Par", m: 6, cu: 15.00 },
        ],
      },
    ],
  },

  // ── 12. VIDRIOS ──
  {
    id: "sec-vidrios",
    title: "12. VIDRIOS",
    groups: [
      {
        id: "vidrios",
        cat: "12. VIDRIOS",
        piso: "3er-piso",
        items: [
          { d: "Ventanas 6 mm, color bronce, sistema corredizo", u: "m²", m: 24.75, cu: 150.00 },
        ],
      },
    ],
  },

  // ── 13. PINTURA ──
  {
    id: "sec-pintura",
    title: "13. PINTURA",
    groups: [
      {
        id: "pintura-3p",
        cat: "13. PINTURA",
        piso: "3er-piso",
        items: [
          { d: "Pintura base y látex 2 manos, muros interiores", u: "m²", m: 885.73, cu: 8.25 },
          { d: "Pintura base y látex 2 manos, muros exteriores", u: "m²", m: 16.99, cu: 10.58 },
          { d: "Zincromato y acrílica, elementos metálicos", u: "Gbl.", m: 1, cu: 750.00 },
        ],
      },
    ],
  },

  // ── 14. MEDIO BAÑO ──
  {
    id: "sec-medio-bano",
    title: "14. MEDIO BAÑO",
    groups: [
      {
        id: "medio-bano",
        cat: "14. MEDIO BAÑO",
        piso: "3er-piso",
        items: [
          { d: "Cerámica piso+zócalo+tarrajeo", u: "Gbl.", m: 1, cu: 1397 },
          { d: "Inodoro+lavatorio+grifería", u: "Gbl.", m: 1, cu: 565 },
          { d: "Colocación+accesorios", u: "Gbl.", m: 1, cu: 448 },
          { d: "Puntos agua+desagüe", u: "Pto.", m: 4, cu: 216 },
          { d: "Puerta+pintura+pegamento", u: "Gbl.", m: 1, cu: 594 },
        ],
      },
    ],
  },

  // ── 15. AZOTEA ──
  {
    id: "sec-azotea",
    title: "15. AZOTEA",
    groups: [
      {
        id: "contrapiso-az",
        cat: "15.01 CONTRAPISO AZOTEA e=0.05m",
        piso: "azotea",
        areaM2: 0,
        areaSource: { type: "manual", nota: "Área contrapiso azotea" },
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 34.30, insumoId: "cem-contr" },
          { d: "Agregados", u: "m³", m: 0, cu: 95 },
          { d: "Mano de obra", u: "m²", m: 0, cu: 18, factor: 1, insumoId: "mo-contr-az" },
        ],
      },
      {
        id: "columnas-az",
        cat: "15.02 COLUMNAS AZOTEA f'c=210 (h=1.5m)",
        piso: "azotea",
        link: "columnas",
        areaM2: 3.75,
        metradoUnit: "m³",
        areaSource: { type: "auto", nota: "Volumen columnas azotea: Σ(b×h×1.5×n)" },
        items: [
          { d: "Cemento", u: "Bls.", m: 33.75, cu: 33, factor: 9, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 1.95, cu: 49.15, factor: 0.52, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 1.99, cu: 55.08, factor: 0.53, insumoId: "grav" },
          { d: 'Acero Ø3/4"', u: "Vlla.", m: 5, cu: 78.50, insumoId: "ace-34" },
          { d: 'Acero Ø5/8"', u: "Vlla.", m: 10, cu: 53.50, insumoId: "ace-58" },
          { d: "Alambre amarre", u: "Kg.", m: 5, cu: 7.20 },
          { d: "Clavos", u: "Kg.", m: 5, cu: 5.51 },
          { d: "MO columnas azotea", u: "Gbl.", m: 1, cu: 1500, insumoId: "mo-col-az" },
        ],
      },
      {
        id: "vigas-az",
        cat: "15.03 VIGAS AZOTEA f'c=210",
        piso: "azotea",
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 33, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 0, cu: 49.15, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 0, cu: 55.08, insumoId: "grav" },
          { d: 'Acero Ø3/4"', u: "Vlla.", m: 0, cu: 78.50, insumoId: "ace-34" },
          { d: 'Acero Ø5/8"', u: "Vlla.", m: 0, cu: 53.50, insumoId: "ace-58" },
          { d: 'Acero Ø1/2"', u: "Vlla.", m: 0, cu: 32.08, insumoId: "ace-12" },
          { d: 'Acero Ø3/8"', u: "Vlla.", m: 0, cu: 18.27, insumoId: "ace-38" },
          { d: "Alambre+clavos", u: "Gbl.", m: 1, cu: 0, insumoId: "alam-clav" },
          { d: "MO vigas azotea", u: "Gbl.", m: 1, cu: 0, insumoId: "mo-vig-az" },
        ],
      },
      {
        id: "losa-az",
        cat: "15.04 LOSA ALIGERADA AZOTEA",
        piso: "azotea",
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 33, insumoId: "cem-c210" },
          { d: "Arena", u: "m³", m: 0, cu: 49.15, insumoId: "are-gru" },
          { d: "Gravilla", u: "m³", m: 0, cu: 55.08, insumoId: "grav" },
          { d: "Ladrillo techo", u: "Und.", m: 0, cu: 2.50, insumoId: "lad-tech" },
          { d: 'Acero Ø1/2"', u: "Vlla.", m: 0, cu: 32.08, insumoId: "ace-12" },
          { d: 'Acero Ø3/8"', u: "Vlla.", m: 0, cu: 18.27, insumoId: "ace-38" },
          { d: 'Acero Ø1/4"', u: "Vlla.", m: 0, cu: 5.60, insumoId: "ace-14" },
          { d: "Alambre+clavos", u: "Gbl.", m: 1, cu: 0, insumoId: "alam-clav" },
          { d: "MO losa azotea", u: "Gbl.", m: 1, cu: 0, insumoId: "mo-los-az" },
        ],
      },
      {
        id: "muros-az",
        cat: "15.05 MUROS PARAPETO AZOTEA",
        piso: "azotea",
        link: "muros",
        areaM2: 113.6,
        areaSource: { type: "auto", nota: "Muros azotea: área nueva" },
        items: [
          { d: "Ladrillo KK 18 huecos", u: "Und.", m: 4430, cu: 0.90, factor: 39, insumoId: "lad-kk" },
          { d: "Cemento", u: "Bls.", m: 19.3, cu: 33, factor: 0.17, insumoId: "cem-c210" },
          { d: "Arena gruesa", u: "m³", m: 2.79, cu: 49.15, factor: 0.0246, insumoId: "are-gru" },
          { d: "MO asentado de ladrillo", u: "m²", m: 113.6, cu: 30, factor: 1.0, insumoId: "mo-asen" },
        ],
      },
      {
        id: "tarrajeo-par-az",
        cat: "15.06 TARRAJEO PARAPETOS AZOTEA",
        piso: "azotea",
        areaM2: 227.2,
        areaSource: { type: "auto", nota: "Muros azotea: área nueva × 2 caras" },
        items: [
          { d: "Cemento", u: "Bls.", m: 31.81, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 4.54, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "m²", m: 227.2, cu: 12, factor: 1.0, insumoId: "mo-tarr-par" },
        ],
      },
      {
        id: "tarrajeo-vig-az",
        cat: "15.07 TARRAJEO VIGAS AZOTEA",
        piso: "azotea",
        areaM2: 0,
        areaSource: { type: "manual", nota: "Vigas azotea: perímetro expuesto × longitud" },
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 0, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 0, insumoId: "mo-tarr-vig-az" },
        ],
      },
      {
        id: "tarrajeo-col-az",
        cat: "15.08 TARRAJEO COLUMNAS AZOTEA",
        piso: "azotea",
        areaM2: 0,
        areaSource: { type: "auto", nota: "Columnas azotea: Σ 2(b+h)×1.5×n" },
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 17.35, factor: 0.14, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 0, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 0, insumoId: "mo-tarr-col-az" },
        ],
      },
      {
        id: "cieloraso-az",
        cat: "15.09 CIELORASO AZOTEA",
        piso: "azotea",
        areaM2: 0,
        areaSource: { type: "manual", nota: "Losa azotea: área" },
        items: [
          { d: "Cemento", u: "Bls.", m: 0, cu: 17.35, factor: 0.16, insumoId: "cem-tarr" },
          { d: "Arena", u: "m³", m: 0, cu: 29.00, factor: 0.02, insumoId: "are-tarr" },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 0, insumoId: "mo-ciel-az" },
        ],
      },
      {
        id: "piso-az",
        cat: "15.10 PISO AZOTEA — IMPERMEABILIZACIÓN",
        piso: "azotea",
        areaM2: 294,
        areaSource: { type: "manual", nota: "Área total de azotea (no depende de muros)" },
        items: [
          { d: "Impermeabilizante acrílico", u: "Gln.", m: 42, cu: 48.00 },
          { d: "Cemento pulido pendiente", u: "m²", m: 294, cu: 15.00, factor: 1.0 },
          { d: "Mano de obra", u: "m²", m: 294, cu: 12, factor: 1.0, insumoId: "mo-imp-az" },
        ],
      },
      {
        id: "inst-az",
        cat: "15.11 INSTALACIONES AZOTEA",
        piso: "azotea",
        items: [
          { d: 'Sumidero pluvial 3"', u: "Und.", m: 4, cu: 85.00 },
          { d: 'Bajada pluvial PVC 3"', u: "Ml.", m: 14, cu: 35.50 },
          { d: "Punto de luz (alumbrado)", u: "Pto.", m: 4, cu: 82.45 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 650, insumoId: "mo-inst-az" },
        ],
      },
      {
        id: "pintura-az",
        cat: "15.12 PINTURA AZOTEA",
        piso: "azotea",
        areaM2: 227.2,
        areaSource: { type: "auto", nota: "Muros azotea: área nueva × 2 caras" },
        items: [
          { d: "Pintura base y látex 2 manos, parapetos", u: "m²", m: 227.2, cu: 8.25, factor: 1.0 },
          { d: "Mano de obra", u: "Gbl.", m: 1, cu: 450, insumoId: "mo-pint-az" },
        ],
      },
    ],
  },
];
