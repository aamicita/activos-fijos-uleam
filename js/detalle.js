/* ==========================================================
   detalle.js - Detalle y edición de un activo.
   La pantalla recibe el código en la dirección, por ejemplo:
   detalle.html?codigo=AF-2024-001&modo=editar
   Tiene dos modos: "ver" (solo lectura) y "editar".
   ========================================================== */

Almacen.inicializar();

const parametros = new URLSearchParams(window.location.search);
const codigo = parametros.get("codigo");
let modo = parametros.get("modo") === "editar" ? "editar" : "ver";
let activo = codigo ? Almacen.buscarPorCodigo(codigo) : null;

const CLASES_ESTADO = {
  "Buen estado": "etiqueta--bueno",
  "Mantenimiento": "etiqueta--mantenimiento",
  "Dado de baja": "etiqueta--baja"
};

const formulario = document.getElementById("form-detalle");
const aviso = document.getElementById("aviso");

/* Campos editables y su regla de validación (el código no se edita) */
const campos = [
  { id: "nombre", validar: (v) => Validaciones.nombreActivo(v) },
  { id: "categoria", validar: (v) => Validaciones.categoria(v) },
  { id: "valor", validar: (v) => Validaciones.valor(v) },
  { id: "fecha", validar: (v) => Validaciones.fecha(v) },
  { id: "estado", validar: (v) => Validaciones.estado(v) },
  { id: "responsable", validar: (v) => Validaciones.responsable(v) }
];

/* Utilidades ------------------------------------------------------ */
function mostrarAviso(texto, tipo) {
  aviso.className = "aviso" + (tipo ? " aviso--" + tipo : "");
  aviso.textContent = texto;
  aviso.hidden = false;
}

function mostrarError(idCampo, texto) {
  document.getElementById("campo-" + idCampo).classList.toggle("campo--error", texto !== "");
  document.getElementById("mensaje-" + idCampo).textContent = texto;
}

function limpiarErrores() {
  campos.forEach((c) => mostrarError(c.id, ""));
}

function llenarSelect(id, opciones, textoInicial) {
  const inicio = textoInicial ? `<option value="">${textoInicial}</option>` : "";
  document.getElementById(id).innerHTML = inicio +
    opciones.map((o) => `<option value="${Utiles.escapar(o)}">${Utiles.escapar(o)}</option>`).join("");
}

/* Mostrar los datos del activo ------------------------------------ */
function llenarListas() {
  llenarSelect("categoria", CATEGORIAS);
  // "Dado de baja" no se elige a mano: se hace con el botón y su motivo
  const estados = activo.estado === "Dado de baja" ? ESTADOS : ESTADOS.filter((e) => e !== "Dado de baja");
  llenarSelect("estado", estados);
  llenarSelect("motivo", MOTIVOS_BAJA, "Selecciona un motivo");
}

function cargarDatos() {
  document.getElementById("nombre").value = activo.nombre;
  document.getElementById("codigo").value = activo.codigo;
  document.getElementById("categoria").value = activo.categoria;
  document.getElementById("valor").value = Number(activo.valor).toFixed(2);
  document.getElementById("fecha").value = activo.fecha;
  document.getElementById("estado").value = activo.estado;
  document.getElementById("responsable").value = activo.responsable;

  const etiqueta = document.getElementById("etiqueta-estado");
  etiqueta.textContent = activo.estado;
  etiqueta.className = "etiqueta " + (CLASES_ESTADO[activo.estado] || "");

  document.getElementById("subtitulo").textContent = `${activo.codigo} · ${activo.nombre}`;
}

/* Cambiar entre "ver" y "editar" ----------------------------------- */
function establecerModo(nuevoModo) {
  const deBaja = activo.estado === "Dado de baja";
  // Un activo dado de baja ya no se puede modificar
  modo = deBaja ? "ver" : nuevoModo;
  const editando = modo === "editar";

  campos.forEach((c) => { document.getElementById(c.id).disabled = !editando; });

  document.getElementById("acciones-ver").hidden = editando;
  document.getElementById("acciones-editar").hidden = !editando;
  document.getElementById("titulo").textContent = editando ? "Editar activo" : "Detalle del activo";

  ["boton-editar", "boton-asignar", "boton-baja"].forEach((id) => {
    document.getElementById(id).disabled = deBaja;
  });

  limpiarErrores();
  history.replaceState(null, "", `detalle.html?codigo=${encodeURIComponent(activo.codigo)}&modo=${modo}`);
}

// Vuelve a leer el activo guardado y refresca toda la pantalla
function refrescar(nuevoModo) {
  activo = Almacen.buscarPorCodigo(codigo);
  llenarListas();
  cargarDatos();
  establecerModo(nuevoModo);
}

/* Validación en vivo ------------------------------------------------ */
function validarCampo(campo) {
  const error = campo.validar(document.getElementById(campo.id).value);
  mostrarError(campo.id, error);
  return error === "";
}

campos.forEach((campo) => {
  const elemento = document.getElementById(campo.id);
  const evento = elemento.tagName === "SELECT" || elemento.type === "date" ? "change" : "blur";
  elemento.addEventListener(evento, () => { if (modo === "editar") validarCampo(campo); });
  elemento.addEventListener("input", () => {
    if (document.getElementById("campo-" + campo.id).classList.contains("campo--error")) validarCampo(campo);
  });
});

/* Editar y guardar cambios ------------------------------------------ */
document.getElementById("boton-editar").addEventListener("click", () => {
  aviso.hidden = true;
  establecerModo("editar");
  document.getElementById("nombre").focus();
});

document.getElementById("boton-cancelar").addEventListener("click", () => {
  aviso.hidden = true;
  cargarDatos(); // descarta lo que se haya escrito
  establecerModo("ver");
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (modo !== "editar") return;

  const resultados = campos.map(validarCampo);
  if (resultados.includes(false)) {
    const primero = campos.find((c) => document.getElementById("campo-" + c.id).classList.contains("campo--error"));
    document.getElementById(primero.id).focus();
    return;
  }

  const nuevos = {
    nombre: document.getElementById("nombre").value.trim(),
    categoria: document.getElementById("categoria").value,
    valor: Number(document.getElementById("valor").value.trim().replace(",", ".")),
    fecha: document.getElementById("fecha").value,
    estado: document.getElementById("estado").value,
    responsable: document.getElementById("responsable").value.trim()
  };

  // Solo se guardan los campos que realmente cambiaron
  const cambios = {};
  Object.keys(nuevos).forEach((clave) => {
    if (nuevos[clave] !== activo[clave]) cambios[clave] = nuevos[clave];
  });

  if (Object.keys(cambios).length === 0) {
    mostrarAviso("No hay cambios para guardar.", "info");
    return;
  }

  const error = Almacen.actualizarActivo(codigo, cambios);
  if (error !== "") {
    mostrarAviso(error);
    return;
  }

  refrescar("ver");
  mostrarAviso("Los cambios se guardaron correctamente.", "exito");
});

/* Asignar responsable ------------------------------------------------ */
const modalResponsable = document.getElementById("modal-responsable");
const inputNuevoResponsable = document.getElementById("nuevo-responsable");

function errorNuevoResponsable(texto) {
  document.getElementById("campo-nuevo-responsable").classList.toggle("campo--error", texto !== "");
  document.getElementById("mensaje-nuevo-responsable").textContent = texto;
}

document.getElementById("boton-asignar").addEventListener("click", () => {
  document.getElementById("texto-responsable").textContent =
    `Responsable actual de "${activo.nombre}": ${activo.responsable}.`;
  inputNuevoResponsable.value = "";
  errorNuevoResponsable("");
  modalResponsable.showModal();
  inputNuevoResponsable.focus();
});

document.getElementById("responsable-cancelar").addEventListener("click", () => modalResponsable.close());

document.getElementById("form-responsable").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nuevo = inputNuevoResponsable.value.trim();
  let error = Validaciones.responsable(nuevo);
  if (error === "" && nuevo === activo.responsable) error = "Esa persona o departamento ya es el responsable.";
  errorNuevoResponsable(error);
  if (error !== "") return;

  Almacen.actualizarActivo(codigo, { responsable: nuevo }, "Reasignación de responsable");
  modalResponsable.close();
  refrescar("ver");
  mostrarAviso(`Responsable actualizado: ${nuevo}.`, "exito");
});

/* Dar de baja ---------------------------------------------------------- */
const modalBaja = document.getElementById("modal-baja");

document.getElementById("boton-baja").addEventListener("click", () => {
  document.getElementById("texto-baja").textContent =
    `Vas a dar de baja "${activo.nombre}" (${activo.codigo}). Después ya no podrás modificarlo.`;
  document.getElementById("motivo").value = "";
  document.getElementById("campo-motivo").classList.remove("campo--error");
  document.getElementById("mensaje-motivo").textContent = "";
  modalBaja.showModal();
});

document.getElementById("baja-cancelar").addEventListener("click", () => modalBaja.close());

document.getElementById("form-baja").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const motivo = document.getElementById("motivo").value;
  if (motivo === "") {
    document.getElementById("campo-motivo").classList.add("campo--error");
    document.getElementById("mensaje-motivo").textContent = "Selecciona el motivo de la baja.";
    return;
  }

  const error = Almacen.darDeBaja(codigo, motivo);
  modalBaja.close();
  if (error !== "") {
    mostrarAviso(error);
    return;
  }

  refrescar("ver");
  mostrarAviso(`El activo ${codigo} fue dado de baja.`, "exito");
});

/* Arranque --------------------------------------------------------------- */
if (activo === null) {
  // El código no existe: se muestra un mensaje en lugar del formulario
  document.getElementById("no-encontrado").hidden = false;
  document.getElementById("titulo").textContent = "Activo no encontrado";
  document.getElementById("subtitulo").textContent = "Revisa el enlace o vuelve al listado";
} else {
  document.getElementById("fecha").max = Utiles.hoyISO();
  formulario.hidden = false;
  llenarListas();
  cargarDatos();
  establecerModo(modo);
  if (activo.estado === "Dado de baja") {
    mostrarAviso("Este activo está dado de baja y ya no puede modificarse.", "info");
  }
}
