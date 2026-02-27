export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  precio: number;
  grupo: "material" | "mano-de-obra" | "equipo";
}

export const INSUMOS_INIT: Insumo[] = [
  // ── Materiales ──
  { id: "cem-c210",  nombre: "Cemento concreto",   unidad: "Bls.",  precio: 33.00,  grupo: "material" },
  { id: "cem-tarr",  nombre: "Cemento tarrajeo",   unidad: "Bls.",  precio: 17.35,  grupo: "material" },
  { id: "cem-contr", nombre: "Cemento contrapiso", unidad: "Bls.",  precio: 34.30,  grupo: "material" },
  { id: "are-gru",   nombre: "Arena gruesa",       unidad: "m3",    precio: 49.15,  grupo: "material" },
  { id: "are-tarr",  nombre: "Arena tarrajeo",     unidad: "m3",    precio: 29.00,  grupo: "material" },
  { id: "grav",      nombre: "Gravilla",           unidad: "m3",    precio: 55.08,  grupo: "material" },
  { id: "ace-34",    nombre: 'Acero 3/4"',         unidad: "Vlla.", precio: 78.50,  grupo: "material" },
  { id: "ace-58",    nombre: 'Acero 5/8"',         unidad: "Vlla.", precio: 53.50,  grupo: "material" },
  { id: "ace-12",    nombre: 'Acero 1/2"',         unidad: "Vlla.", precio: 32.08,  grupo: "material" },
  { id: "ace-38",    nombre: 'Acero 3/8"',         unidad: "Vlla.", precio: 18.27,  grupo: "material" },
  { id: "ace-14",    nombre: 'Acero 1/4"',         unidad: "Vlla.", precio: 5.60,   grupo: "material" },
  { id: "lad-kk",    nombre: "Ladrillo KK 18h",   unidad: "Und.",  precio: 0.90,   grupo: "material" },
  { id: "lad-tech",  nombre: "Ladrillo techo",     unidad: "Und.",  precio: 2.50,   grupo: "material" },
  { id: "alam-clav", nombre: "Alambre+clavos",     unidad: "Gbl.",  precio: 381.00, grupo: "material" },
  // ── Mano de Obra ──
  { id: "mo-contr",     nombre: "MO contrapiso",             unidad: "m²",   precio: 18.00,    grupo: "mano-de-obra" },
  { id: "mo-col",       nombre: "MO columnas f'c=210",       unidad: "Gbl.", precio: 3000.00,  grupo: "mano-de-obra" },
  { id: "mo-vig",       nombre: "MO vigas f'c=210",          unidad: "Gbl.", precio: 15500.00, grupo: "mano-de-obra" },
  { id: "mo-los",       nombre: "MO losa aligerada",         unidad: "Gbl.", precio: 7500.00,  grupo: "mano-de-obra" },
  { id: "mo-esc",       nombre: "MO escalera",               unidad: "Gbl.", precio: 4500.00,  grupo: "mano-de-obra" },
  { id: "mo-asen",      nombre: "MO asentado de ladrillo",   unidad: "m²",   precio: 30.00,    grupo: "mano-de-obra" },
  { id: "mo-tarr-ie",   nombre: "MO tarrajeo int/ext",       unidad: "Gbl.", precio: 3600.00,  grupo: "mano-de-obra" },
  { id: "mo-tarr-vig",  nombre: "MO tarrajeo vigas",         unidad: "Gbl.", precio: 3340.00,  grupo: "mano-de-obra" },
  { id: "mo-tarr-col",  nombre: "MO tarrajeo columnas",      unidad: "Gbl.", precio: 1080.00,  grupo: "mano-de-obra" },
  { id: "mo-tarr-der",  nombre: "MO derrames",               unidad: "Gbl.", precio: 1050.00,  grupo: "mano-de-obra" },
  { id: "mo-tarr-esc",  nombre: "MO revest. escalera",       unidad: "Gbl.", precio: 900.00,   grupo: "mano-de-obra" },
  { id: "mo-ciel",      nombre: "MO cieloraso",              unidad: "Gbl.", precio: 4074.00,  grupo: "mano-de-obra" },
  { id: "mo-piso",      nombre: "MO piso alto tránsito",     unidad: "Gbl.", precio: 3760.80,  grupo: "mano-de-obra" },
  { id: "mo-piso-esc",  nombre: "MO acabado escalera",       unidad: "Gbl.", precio: 1200.00,  grupo: "mano-de-obra" },
  { id: "mo-ench",      nombre: "MO enchapes",               unidad: "Gbl.", precio: 960.00,   grupo: "mano-de-obra" },
  { id: "mo-czoc",      nombre: "MO contrazócalos",          unidad: "Gbl.", precio: 1160.00,  grupo: "mano-de-obra" },
  { id: "mo-san",       nombre: "MO inst. sanitarias",       unidad: "Gbl.", precio: 1340.00,  grupo: "mano-de-obra" },
  { id: "mo-apar",      nombre: "MO aparatos sanitarios",    unidad: "Gbl.", precio: 350.00,   grupo: "mano-de-obra" },
  { id: "mo-elec",      nombre: "MO inst. eléctricas",       unidad: "Gbl.", precio: 2400.00,  grupo: "mano-de-obra" },
  { id: "mo-tarr-par",  nombre: "MO tarrajeo parapeto",      unidad: "m²",   precio: 12.00,    grupo: "mano-de-obra" },
  { id: "mo-imp-az",    nombre: "MO impermeab. azotea",      unidad: "m²",   precio: 12.00,    grupo: "mano-de-obra" },
  { id: "mo-inst-az",   nombre: "MO inst. azotea",           unidad: "Gbl.", precio: 650.00,   grupo: "mano-de-obra" },
  { id: "mo-pint-az",   nombre: "MO pintura azotea",         unidad: "Gbl.", precio: 450.00,   grupo: "mano-de-obra" },
  // ── Mano de Obra Azotea (estructura) ──
  { id: "mo-contr-az",    nombre: "MO contrapiso azotea",      unidad: "m²",   precio: 18.00,   grupo: "mano-de-obra" },
  { id: "mo-col-az",      nombre: "MO columnas azotea",        unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
  { id: "mo-vig-az",      nombre: "MO vigas azotea",           unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
  { id: "mo-los-az",      nombre: "MO losa azotea",            unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
  { id: "mo-tarr-ie-az",  nombre: "MO tarrajeo int/ext azotea", unidad: "Gbl.", precio: 0,      grupo: "mano-de-obra" },
  { id: "mo-tarr-vig-az", nombre: "MO tarrajeo vigas azotea",  unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
  { id: "mo-tarr-col-az", nombre: "MO tarrajeo col. azotea",   unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
  { id: "mo-ciel-az",     nombre: "MO cieloraso azotea",       unidad: "Gbl.", precio: 0,       grupo: "mano-de-obra" },
];
