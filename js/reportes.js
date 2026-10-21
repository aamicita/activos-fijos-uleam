/* ==========================================================
   reportes.js - Historial de altas y bajas de activos.
   Lee los movimientos de localStorage (por storage.js), los
   filtra por rango de fechas y permite exportarlos a CSV
   (un archivo que se abre directamente en Excel).
   ========================================================== */

Almacen.inicializar();

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const inputDesde = document.getElementById("desde");
const inputHasta = document.getElementById("hasta");
const aviso = document.getElementById("aviso");

let filtrados = []; // movimientos del periodo que se está mostrando

/* Solo altas y bajas (las ediciones no van en este reporte).
   Se guarda la posición original para ordenar bien movimientos del mismo día. */
function obtenerAltasYBajas() {
  return Almacen.obtenerMovimientos()
    .map((m, posicion) => ({ ...m, posicion: posicion }))
    .filter((m) => m.tipo === "Alta" || m.tipo === "Baja");
}

/* Fechas iniciales: desde el primer movimiento hasta hoy */
function fijarFechasIniciales() {
  const hoy = Utiles.hoyISO();
  const fechas = obtenerAltasYBajas().map((m) => m.fecha).sort();
  inputDesde.value = fechas.length > 0 ? fechas[0] : hoy.slice(0, 8) + "01";
  inputHasta.value = hoy;
  inputDesde.max = hoy;
  inputHasta.max = hoy;
}

/* Errores por campo ------------------------------------------- */
function mostrarError(id, texto) {
  document.getElementById("campo-" + id).classList.toggle("campo--error", texto !== "");
  document.getElementById("mensaje-" + id).textContent = texto;
}

function validarFiltros() {
  const errorDesde = Validaciones.fecha(inputDesde.value);
  const errorHasta = Validaciones.fecha(inputHasta.value);
  mostrarError("desde", errorDesde);
  mostrarError("hasta", errorHasta);
  if (errorDesde !== "" || errorHasta !== "") return false;

  const errorRango = Validaciones.rangoFechas(inputDesde.value, inputHasta.value);
  mostrarError("desde", errorRango);
  return errorRango === "";
}

/* Texto del periodo: "Mayo — Junio", "Junio 2024" o con años distintos */
function etiquetaPeriodo(desde, hasta) {
  const [anioDesde, mesDesde] = desde.split("-").map(Number);
  const [anioHasta, mesHasta] = hasta.split("-").map(Number);
  const nombreDesde = MESES[mesDesde - 1];
  const nombreHasta = MESES[mesHasta - 1];

  if (anioDesde === anioHasta) {
    return mesDesde === mesHasta ? `${nombreDesde} ${anioDesde}` : `${nombreDesde} — ${nombreHasta}`;
  }
  return `${nombreDesde} ${anioDesde} — ${nombreHasta} ${anioHasta}`;
}

/* Dibujar la tabla --------------------------------------------- */
function pintar() {
  const cuerpo = document.getElementById("filas");

  cuerpo.innerHTML = filtrados.length > 0
    ? filtrados.map((m) => `
        <tr>
          <td class="fecha">${Utiles.formatearFecha(m.fecha)}</td>
          <td class="activo">${Utiles.escapar(m.nombre)}</td>
          <td><span class="etiqueta ${m.tipo === "Baja" ? "etiqueta--baja" : "etiqueta--alta"}">${Utiles.escapar(m.tipo)}</span></td>
          <td class="motivo">${Utiles.escapar(m.motivo)}</td>
        </tr>`).join("")
    : '<tr><td colspan="4" class="tabla__vacia">No hay movimientos en este rango.</td></tr>';

  const cantidad = filtrados.length;
  document.getElementById("subtitulo").textContent =
    `${cantidad} ${cantidad === 1 ? "movimiento" : "movimientos"} en el periodo seleccionado`;
  document.getElementById("periodo").textContent = etiquetaPeriodo(inputDesde.value, inputHasta.value);
}

/* Aplicar los filtros ------------------------------------------- */
function aplicarFiltros() {
  if (!validarFiltros()) return false;

  const desde = inputDesde.value;
  const hasta = inputHasta.value;

  filtrados = obtenerAltasYBajas()
    .filter((m) => m.fecha >= desde && m.fecha <= hasta)
    // Más recientes primero; si es el mismo día, el último registrado primero
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.posicion - a.posicion);

  pintar();
  return true;
}

document.getElementById("form-filtros").addEventListener("submit", (evento) => {
  evento.preventDefault();
  aviso.hidden = true;
  aplicarFiltros();
});

// Los errores se quitan al corregir la fecha
[inputDesde, inputHasta].forEach((input) => {
  input.addEventListener("input", () => {
    mostrarError("desde", "");
    mostrarError("hasta", "");
  });
});

/* Exportar a CSV ------------------------------------------------- */
// Evita que Excel interprete un texto como fórmula (=, +, -, @)
function celda(valor) {
  let texto = String(valor);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

document.getElementById("boton-exportar").addEventListener("click", () => {
  aviso.hidden = true;
  if (!aplicarFiltros()) return; // se exporta lo mismo que se ve en pantalla

  if (filtrados.length === 0) {
    aviso.className = "aviso";
    aviso.textContent = "No hay movimientos para exportar en este rango.";
    aviso.hidden = false;
    return;
  }

  // Se usa ";" como separador porque Excel en español lo espera así
  const lineas = [["Fecha", "Código", "Activo", "Movimiento", "Motivo"].map(celda).join(";")];
  filtrados.forEach((m) => {
    lineas.push([m.fecha, m.codigo, m.nombre, m.tipo, m.motivo].map(celda).join(";"));
  });

  // El "\ufeff" del inicio hace que Excel muestre bien las tildes y la ñ
  const archivo = new Blob(["\ufeff" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `reporte-movimientos_${inputDesde.value}_a_${inputHasta.value}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(enlace.href);

  aviso.className = "aviso aviso--exito";
  aviso.textContent = `Reporte exportado: ${filtrados.length} ${filtrados.length === 1 ? "movimiento" : "movimientos"}.`;
  aviso.hidden = false;
});

/* Arranque ------------------------------------------------------- */
fijarFechasIniciales();
aplicarFiltros();
