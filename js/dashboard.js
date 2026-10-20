/* ==========================================================
   dashboard.js - Calcula y muestra el resumen del inventario
   leyendo los datos guardados en localStorage (por storage.js).
   ========================================================== */

Almacen.inicializar(); // carga datos de ejemplo la primera vez

// Porcentaje con un decimal, sin ".0" sobrante (87 o 7.5)
function porcentaje(parte, total) {
  if (total === 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

function contarEstado(activos, estado) {
  return activos.filter((a) => a.estado === estado).length;
}

/* 1. Tarjetas de resumen ------------------------------------ */
function pintarResumen() {
  const activos = Almacen.obtenerActivos();
  const movimientos = Almacen.obtenerMovimientos();
  const total = activos.length;

  const buenos = contarEstado(activos, "Buen estado");
  const mantenimiento = contarEstado(activos, "Mantenimiento");
  const bajas = contarEstado(activos, "Dado de baja");

  // Altas registradas durante el mes actual
  const mesActual = Utiles.hoyISO().slice(0, 7); // "2026-10"
  const altasDelMes = movimientos.filter((m) => m.tipo === "Alta" && m.fecha.startsWith(mesActual)).length;

  document.getElementById("n-total").textContent = total.toLocaleString("es-EC");
  document.getElementById("n-bueno").textContent = buenos.toLocaleString("es-EC");
  document.getElementById("n-mant").textContent = mantenimiento.toLocaleString("es-EC");
  document.getElementById("n-baja").textContent = bajas.toLocaleString("es-EC");

  document.getElementById("d-total").textContent = `+${altasDelMes} este mes`;
  document.getElementById("d-bueno").textContent = `${porcentaje(buenos, total)}% del total`;
  document.getElementById("d-mant").textContent = `${porcentaje(mantenimiento, total)}% del total`;
  document.getElementById("d-baja").textContent = `${porcentaje(bajas, total)}% del total`;
}

/* 2. Activos por categoría ---------------------------------- */
function llenarFiltroAnios() {
  const selector = document.getElementById("filtro-anio");
  const anios = [...new Set(Almacen.obtenerActivos().map((a) => a.fecha.slice(0, 4)))].sort().reverse();

  selector.innerHTML = '<option value="todos">Todos los años</option>' +
    anios.map((anio) => `<option value="${anio}">${anio}</option>`).join("");
}

function pintarBarras() {
  const anio = document.getElementById("filtro-anio").value;
  let activos = Almacen.obtenerActivos();
  if (anio !== "todos") {
    activos = activos.filter((a) => a.fecha.startsWith(anio));
  }

  const cantidades = CATEGORIAS.map((categoria) => ({
    categoria: categoria,
    cantidad: activos.filter((a) => a.categoria === categoria).length
  }));
  const maximo = Math.max(...cantidades.map((c) => c.cantidad), 1);

  document.getElementById("barras").innerHTML = cantidades.map((c) => `
    <div class="barra">
      <span>${Utiles.escapar(c.categoria)}</span>
      <div class="barra__pista"><div class="barra__relleno" style="width:${(c.cantidad / maximo) * 100}%"></div></div>
      <span class="barra__cantidad">${c.cantidad}</span>
    </div>
  `).join("");
}

/* 3. Actividad reciente ------------------------------------- */
function pintarActividad() {
  const lista = document.getElementById("actividad");
  const recientes = Almacen.obtenerMovimientos()
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  if (recientes.length === 0) {
    lista.innerHTML = '<li class="vacio">Todavía no hay movimientos registrados.</li>';
    return;
  }

  lista.innerHTML = recientes.map((m) => `
    <li>
      <span class="actividad__punto ${m.tipo === "Baja" ? "actividad__punto--baja" : ""}"></span>
      <div>
        <strong>${Utiles.escapar(m.nombre)}</strong>
        <small>${Utiles.escapar(m.tipo)}</small>
      </div>
      <span class="actividad__fecha">${Utiles.formatearFecha(m.fecha)}</span>
    </li>
  `).join("");
}

/* Arranque --------------------------------------------------- */
pintarResumen();
llenarFiltroAnios();
pintarBarras();
pintarActividad();
document.getElementById("filtro-anio").addEventListener("change", pintarBarras);
