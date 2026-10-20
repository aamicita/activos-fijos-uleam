/* ==========================================================
   registrar.js - Lógica del formulario "Registrar nuevo activo".
   Valida cada campo con Validaciones y guarda con Almacen.
   ========================================================== */

Almacen.inicializar();

const formulario = document.getElementById("form-registro");
const avisoExito = document.getElementById("aviso-exito");

/* Llenar los desplegables con las listas de storage.js */
function llenarSelect(id, textoInicial, opciones) {
  document.getElementById(id).innerHTML =
    `<option value="">${textoInicial}</option>` +
    opciones.map((o) => `<option value="${Utiles.escapar(o)}">${Utiles.escapar(o)}</option>`).join("");
}
llenarSelect("categoria", "Selecciona una categoría", CATEGORIAS);
llenarSelect("estado", "Selecciona un estado", ESTADOS);

/* La fecha no puede elegirse después de hoy */
document.getElementById("fecha").max = Utiles.hoyISO();

/* Lista de campos: cada uno con su regla de validación */
const campos = [
  { id: "nombre", validar: (v) => Validaciones.nombreActivo(v) },
  { id: "codigo", validar: (v) => Validaciones.codigo(v) || codigoRepetido(v) },
  { id: "categoria", validar: (v) => Validaciones.categoria(v) },
  { id: "valor", validar: (v) => Validaciones.valor(v) },
  { id: "fecha", validar: (v) => Validaciones.fecha(v) },
  { id: "estado", validar: (v) => Validaciones.estado(v) },
  { id: "responsable", validar: (v) => Validaciones.responsable(v) }
];

// El código debe ser único: se busca en lo ya guardado
function codigoRepetido(valor) {
  return Almacen.buscarPorCodigo(valor.trim()) ? "Ya existe un activo con ese código." : "";
}

function mostrarError(id, texto) {
  document.getElementById("campo-" + id).classList.toggle("campo--error", texto !== "");
  document.getElementById("mensaje-" + id).textContent = texto;
}

function validarCampo(campo) {
  const error = campo.validar(document.getElementById(campo.id).value);
  mostrarError(campo.id, error);
  return error === "";
}

/* Validación en vivo: al salir del campo y mientras se corrige */
campos.forEach((campo) => {
  const elemento = document.getElementById(campo.id);
  const evento = elemento.tagName === "SELECT" || elemento.type === "date" ? "change" : "blur";
  elemento.addEventListener(evento, () => validarCampo(campo));
  elemento.addEventListener("input", () => {
    avisoExito.hidden = true;
    if (document.getElementById("campo-" + campo.id).classList.contains("campo--error")) {
      validarCampo(campo);
    }
  });
});

/* El código se escribe siempre en mayúsculas y sin espacios */
document.getElementById("codigo").addEventListener("input", (evento) => {
  evento.target.value = evento.target.value.toUpperCase().replace(/\s/g, "");
});

/* Guardar */
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  // Se validan todos los campos (sin cortar en el primer error)
  const resultados = campos.map(validarCampo);
  if (resultados.includes(false)) {
    const primero = campos.find((c) => document.getElementById("campo-" + c.id).classList.contains("campo--error"));
    document.getElementById(primero.id).focus();
    return;
  }

  const activo = {
    codigo: document.getElementById("codigo").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    categoria: document.getElementById("categoria").value,
    valor: Number(document.getElementById("valor").value.trim().replace(",", ".")),
    fecha: document.getElementById("fecha").value,
    estado: document.getElementById("estado").value,
    responsable: document.getElementById("responsable").value.trim()
  };

  const error = Almacen.agregarActivo(activo);
  if (error !== "") {
    mostrarError("codigo", error);
    return;
  }

  limpiarFormulario();
  avisoExito.innerHTML = `Activo <strong>${Utiles.escapar(activo.codigo)}</strong> registrado correctamente. ` +
    `<a href="dashboard.html">Ver panel principal</a>`;
  avisoExito.hidden = false;
  avisoExito.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

/* Cancelar: vacía el formulario y quita los errores */
function limpiarFormulario() {
  formulario.reset();
  campos.forEach((campo) => mostrarError(campo.id, ""));
}
document.getElementById("boton-cancelar").addEventListener("click", () => {
  limpiarFormulario();
  avisoExito.hidden = true;
});
