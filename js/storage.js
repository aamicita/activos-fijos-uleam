/* ==========================================================
   storage.js - Capa de almacenamiento del sistema.
   Es el ÚNICO archivo que habla con localStorage. Las pantallas
   solo llaman a las funciones de "Almacen". Así, si algún día
   se conecta un backend, solo se cambia este archivo.
   ========================================================== */

const CATEGORIAS = ["Tecnología", "Mobiliario", "Laboratorio", "Audiovisual", "Climatización", "Otros"];
const ESTADOS = ["Buen estado", "Mantenimiento", "Dado de baja"];

/* Utilidades pequeñas que usan varias pantallas -------------- */
const Utiles = {
  meses: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],

  // Convierte "2024-06-14" en "14 jun 2024"
  formatearFecha(iso) {
    const [anio, mes, dia] = iso.split("-");
    return `${dia} ${this.meses[Number(mes) - 1]} ${anio}`;
  },

  // Fecha de hoy en formato "2026-10-20"
  hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  },

  // Evita que texto con símbolos como < o > rompa el HTML
  escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }
};

/* Datos de ejemplo (solo se cargan la primera vez) ----------- */
const ACTIVOS_EJEMPLO = [
  { codigo: "AF-2024-001", nombre: "Laptop Dell Latitude 5540", categoria: "Tecnología", valor: 1450, fecha: "2024-06-14", estado: "Buen estado", responsable: "María Zambrano" },
  { codigo: "AF-2024-018", nombre: "Proyector Epson PowerLite", categoria: "Audiovisual", valor: 820, fecha: "2024-06-08", estado: "Mantenimiento", responsable: "Facultad de Ingeniería" },
  { codigo: "AF-2023-142", nombre: "Escritorio modular", categoria: "Mobiliario", valor: 310, fecha: "2023-03-12", estado: "Buen estado", responsable: "Talento Humano" },
  { codigo: "AF-2022-089", nombre: "Impresora HP LaserJet Pro", categoria: "Tecnología", valor: 540, fecha: "2022-09-20", estado: "Buen estado", responsable: "Secretaría General" },
  { codigo: "AF-2021-064", nombre: "Aire acondicionado LG", categoria: "Climatización", valor: 980, fecha: "2021-02-10", estado: "Dado de baja", responsable: "Biblioteca Central" },
  { codigo: "AF-2024-021", nombre: "Microscopio binocular", categoria: "Laboratorio", valor: 1900, fecha: "2024-05-24", estado: "Buen estado", responsable: "Facultad de Ciencias" },
  { codigo: "AF-2023-077", nombre: "Silla ergonómica", categoria: "Mobiliario", valor: 180, fecha: "2023-07-01", estado: "Dado de baja", responsable: "Decanato" },
  { codigo: "AF-2024-005", nombre: "Monitor Samsung 24\"", categoria: "Tecnología", valor: 210, fecha: "2024-01-15", estado: "Dado de baja", responsable: "Departamento de Sistemas" },
  { codigo: "AF-2022-110", nombre: "Pizarra interactiva", categoria: "Audiovisual", valor: 1200, fecha: "2022-11-05", estado: "Buen estado", responsable: "Facultad de Educación" },
  { codigo: "AF-2023-031", nombre: "Centrifugadora de laboratorio", categoria: "Laboratorio", valor: 2400, fecha: "2023-04-18", estado: "Mantenimiento", responsable: "Facultad de Ciencias" },
  { codigo: "AF-2024-033", nombre: "Archivador metálico", categoria: "Mobiliario", valor: 150, fecha: "2024-02-09", estado: "Buen estado", responsable: "Secretaría General" },
  { codigo: "AF-2022-045", nombre: "Servidor Dell PowerEdge", categoria: "Tecnología", valor: 5200, fecha: "2022-05-30", estado: "Buen estado", responsable: "Departamento de Sistemas" }
];

const MOVIMIENTOS_EJEMPLO = [
  { fecha: "2024-06-14", codigo: "AF-2024-001", nombre: "Laptop Dell Latitude 5540", tipo: "Alta", motivo: "Adquisición institucional" },
  { fecha: "2024-06-12", codigo: "AF-2024-005", nombre: "Monitor Samsung 24\"", tipo: "Baja", motivo: "Fin de vida útil" },
  { fecha: "2024-06-08", codigo: "AF-2024-018", nombre: "Proyector Epson PowerLite", tipo: "Alta", motivo: "Donación" },
  { fecha: "2024-05-30", codigo: "AF-2023-077", nombre: "Silla ergonómica", tipo: "Baja", motivo: "Deterioro irreversible" },
  { fecha: "2024-05-24", codigo: "AF-2024-021", nombre: "Microscopio binocular", tipo: "Alta", motivo: "Compra para laboratorio" },
  { fecha: "2024-04-02", codigo: "AF-2021-064", nombre: "Aire acondicionado LG", tipo: "Baja", motivo: "Daño irreparable" }
];

/* Funciones de almacenamiento -------------------------------- */
const Almacen = {
  claveActivos: "af_activos",
  claveMovimientos: "af_movimientos",

  leer(clave) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || [];
    } catch (error) {
      return []; // si el dato está dañado, se empieza con lista vacía
    }
  },

  escribir(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
  },

  // Carga los datos de ejemplo solo si todavía no existen
  inicializar() {
    if (localStorage.getItem(this.claveActivos) === null) {
      this.escribir(this.claveActivos, ACTIVOS_EJEMPLO);
      this.escribir(this.claveMovimientos, MOVIMIENTOS_EJEMPLO);
    }
  },

  obtenerActivos() { return this.leer(this.claveActivos); },
  obtenerMovimientos() { return this.leer(this.claveMovimientos); },

  buscarPorCodigo(codigo) {
    return this.obtenerActivos().find((a) => a.codigo === codigo) || null;
  },

  registrarMovimiento(activo, tipo, motivo) {
    const movimientos = this.obtenerMovimientos();
    movimientos.push({
      fecha: Utiles.hoyISO(),
      codigo: activo.codigo,
      nombre: activo.nombre,
      tipo: tipo,
      motivo: motivo
    });
    this.escribir(this.claveMovimientos, movimientos);
  },

  // Devuelve "" si todo salió bien, o el texto del error
  agregarActivo(activo) {
    const activos = this.obtenerActivos();
    if (activos.some((a) => a.codigo === activo.codigo)) {
      return "Ya existe un activo con ese código.";
    }
    activos.push(activo);
    this.escribir(this.claveActivos, activos);
    this.registrarMovimiento(activo, "Alta", "Registro en el sistema");
    return "";
  },

  actualizarActivo(codigo, cambios) {
    const activos = this.obtenerActivos();
    const posicion = activos.findIndex((a) => a.codigo === codigo);
    if (posicion === -1) return "No se encontró el activo.";
    activos[posicion] = { ...activos[posicion], ...cambios };
    this.escribir(this.claveActivos, activos);
    this.registrarMovimiento(activos[posicion], "Edición", "Actualización de datos");
    return "";
  },

  darDeBaja(codigo, motivo) {
    const activos = this.obtenerActivos();
    const activo = activos.find((a) => a.codigo === codigo);
    if (!activo) return "No se encontró el activo.";
    activo.estado = "Dado de baja";
    this.escribir(this.claveActivos, activos);
    this.registrarMovimiento(activo, "Baja", motivo);
    return "";
  }
};
