/* ==========================================================
   activos.js - Lógica del listado de activos.
   Lee los activos de localStorage (por storage.js), los filtra,
   los divide en páginas y permite darlos de baja.
   ========================================================== */

Almacen.inicializar();

const POR_PAGINA = 5;
const MOTIVOS_BAJA = ["Fin de vida útil", "Deterioro irreversible", "Daño irreparable", "Obsolescencia", "Pérdida o robo", "Otro"];
const CLASES_ESTADO = {
  "Buen estado": "etiqueta--bueno",
  "Mantenimiento": "etiqueta--mantenimiento",
  "Dado de baja": "etiqueta--baja"
};

let paginaActual = 1;
let codigoPendiente = null; // activo que se está por dar de baja

const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroEstado = document.getElementById("filtro-estado");
const aviso = document.getElementById("aviso");

/* Llenar los desplegables ------------------------------------ */
function llenarSelect(select, textoInicial, opciones) {
  select.innerHTML = `<option value="">${textoInicial}</option>` +
    opciones.map((o) => `<option value="${Utiles.escapar(o)}">${Utiles.escapar(o)}</option>`).join("");
}
llenarSelect(filtroCategoria, "Todas las categorías", CATEGORIAS);
llenarSelect(filtroEstado, "Todos los estados", ESTADOS);
llenarSelect(document.getElementById("motivo"), "Selecciona un motivo", MOTIVOS_BAJA);

/* Búsqueda sin importar mayúsculas ni tildes ------------------ */
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obtenerFiltrados() {
  const texto = normalizar(buscador.value.trim());
  const categoria = filtroCategoria.value;
  const estado = filtroEstado.value;

  return Almacen.obtenerActivos()
    .filter((a) => {
      const coincideTexto = texto === "" ||
        normalizar(a.codigo).includes(texto) ||
        normalizar(a.nombre).includes(texto) ||
        normalizar(a.responsable).includes(texto);
      const coincideCategoria = categoria === "" || a.categoria === categoria;
      const coincideEstado = estado === "" || a.estado === estado;
      return coincideTexto && coincideCategoria && coincideEstado;
    })
    // Los más recientes primero
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.codigo.localeCompare(b.codigo));
}

/* Dibujar la tabla ------------------------------------------- */
const ICONO_VER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONO_EDITAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
const ICONO_BAJA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>';

function filaHTML(a) {
  const codigo = Utiles.escapar(a.codigo);
  const yaDeBaja = a.estado === "Dado de baja";
  return `
    <tr>
      <td class="codigo">${codigo}</td>
      <td class="nombre">${Utiles.escapar(a.nombre)}</td>
      <td class="suave">${Utiles.escapar(a.categoria)}</td>
      <td class="suave">${Utiles.escapar(a.responsable)}</td>
      <td><span class="etiqueta ${CLASES_ESTADO[a.estado] || ""}">${Utiles.escapar(a.estado)}</span></td>
      <td>
        <div class="acciones">
          <a class="accion" href="detalle.html?codigo=${encodeURIComponent(a.codigo)}&modo=ver" title="Ver detalle" aria-label="Ver ${codigo}">${ICONO_VER}</a>
          <a class="accion" href="detalle.html?codigo=${encodeURIComponent(a.codigo)}&modo=editar" title="Editar" aria-label="Editar ${codigo}">${ICONO_EDITAR}</a>
          <button type="button" class="accion accion--baja" data-baja="${codigo}"
            title="${yaDeBaja ? "Este activo ya está dado de baja" : "Dar de baja"}"
            aria-label="Dar de baja ${codigo}" ${yaDeBaja ? "disabled" : ""}>${ICONO_BAJA}</button>
        </div>
      </td>
    </tr>`;
}

function pintar() {
  const lista = obtenerFiltrados();
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;

  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + POR_PAGINA);

  document.getElementById("filas").innerHTML = pagina.length > 0
    ? pagina.map(filaHTML).join("")
    : '<tr><td colspan="6" class="tabla__vacia">No se encontraron activos con esos criterios.</td></tr>';

  document.getElementById("contador").textContent =
    `Mostrando ${pagina.length} de ${lista.length.toLocaleString("es-EC")} activos`;

  pintarPaginacion(totalPaginas);
}

function pintarPaginacion(totalPaginas) {
  const contenedor = document.getElementById("paginacion");
  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  // Ventana de hasta 5 números alrededor de la página actual
  let desde = Math.max(1, paginaActual - 2);
  let hasta = Math.min(totalPaginas, desde + 4);
  desde = Math.max(1, hasta - 4);

  let botones = `<button type="button" data-pagina="${paginaActual - 1}" ${paginaActual === 1 ? "disabled" : ""}>Anterior</button>`;
  for (let n = desde; n <= hasta; n++) {
    botones += `<button type="button" data-pagina="${n}" class="${n === paginaActual ? "actual" : ""}">${n}</button>`;
  }
  botones += `<button type="button" data-pagina="${paginaActual + 1}" ${paginaActual === totalPaginas ? "disabled" : ""}>Siguiente</button>`;
  contenedor.innerHTML = botones;
}

/* Eventos de búsqueda, filtros y paginación -------------------- */
function volverAPrimeraPagina() {
  paginaActual = 1;
  pintar();
}
buscador.addEventListener("input", volverAPrimeraPagina);
filtroCategoria.addEventListener("change", volverAPrimeraPagina);
filtroEstado.addEventListener("change", volverAPrimeraPagina);

document.getElementById("paginacion").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-pagina]");
  if (!boton || boton.disabled) return;
  paginaActual = Number(boton.dataset.pagina);
  pintar();
});

/* Dar de baja: ventana de confirmación ------------------------ */
const modal = document.getElementById("modal-baja");

document.getElementById("filas").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-baja]");
  if (!boton || boton.disabled) return;

  codigoPendiente = boton.dataset.baja;
  const activo = Almacen.buscarPorCodigo(codigoPendiente);
  document.getElementById("modal-texto").textContent =
    `Vas a dar de baja "${activo.nombre}" (${activo.codigo}). Esta acción cambia su estado a "Dado de baja".`;

  document.getElementById("motivo").value = "";
  document.getElementById("campo-motivo").classList.remove("campo--error");
  document.getElementById("mensaje-motivo").textContent = "";
  modal.showModal();
});

document.getElementById("baja-cancelar").addEventListener("click", () => modal.close());

document.getElementById("form-baja").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const motivo = document.getElementById("motivo").value;
  if (motivo === "") {
    document.getElementById("campo-motivo").classList.add("campo--error");
    document.getElementById("mensaje-motivo").textContent = "Selecciona el motivo de la baja.";
    return;
  }

  const error = Almacen.darDeBaja(codigoPendiente, motivo);
  modal.close();

  if (error !== "") {
    aviso.className = "aviso";
    aviso.textContent = error;
  } else {
    aviso.className = "aviso aviso--exito";
    aviso.textContent = `El activo ${codigoPendiente} fue dado de baja.`;
  }
  aviso.hidden = false;
  pintar();
});

pintar();
