/* ==========================================================
   login.js - Lógica de la pantalla de inicio de sesión.
   El acceso es SIMULADO: no hay servidor, se compara contra
   un administrador de prueba y la sesión se guarda en el
   navegador (sessionStorage o localStorage).
   ========================================================== */

// Administrador de prueba (solo para el proyecto de clase)
const ADMIN = {
  usuario: "andrea.mendoza",
  clave: "Admin2026",
  nombre: "Andrea Mendoza",
  rol: "Administradora"
};

const formulario = document.getElementById("form-login");
const inputUsuario = document.getElementById("usuario");
const inputClave = document.getElementById("clave");
const errorGeneral = document.getElementById("error-general");

// Muestra u oculta el error de un campo
function mostrarError(idCampo, idMensaje, texto) {
  const campo = document.getElementById(idCampo);
  const mensaje = document.getElementById(idMensaje);
  mensaje.textContent = texto;
  campo.classList.toggle("campo--error", texto !== "");
}

function validarUsuario() {
  const error = Validaciones.usuario(inputUsuario.value);
  mostrarError("campo-usuario", "mensaje-usuario", error);
  return error === "";
}

function validarClave() {
  const error = Validaciones.clave(inputClave.value);
  mostrarError("campo-clave", "mensaje-clave", error);
  return error === "";
}

// Validación en vivo: al salir de un campo y mientras se corrige
inputUsuario.addEventListener("blur", validarUsuario);
inputClave.addEventListener("blur", validarClave);
inputUsuario.addEventListener("input", () => {
  errorGeneral.hidden = true;
  if (document.getElementById("campo-usuario").classList.contains("campo--error")) validarUsuario();
});
inputClave.addEventListener("input", () => {
  errorGeneral.hidden = true;
  if (document.getElementById("campo-clave").classList.contains("campo--error")) validarClave();
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault(); // evita que la página se recargue

  // Se validan los dos campos (sin cortar en el primero)
  const usuarioOk = validarUsuario();
  const claveOk = validarClave();
  if (!usuarioOk || !claveOk) return;

  const usuario = inputUsuario.value.trim().toLowerCase();
  const credencialesCorrectas = usuario === ADMIN.usuario && inputClave.value === ADMIN.clave;

  if (!credencialesCorrectas) {
    errorGeneral.textContent = "Usuario o contraseña incorrectos.";
    errorGeneral.hidden = false;
    return;
  }

  // Guardar la sesión: con "Recordarme" dura aunque se cierre el navegador
  const sesion = JSON.stringify({ usuario: ADMIN.usuario, nombre: ADMIN.nombre, rol: ADMIN.rol });
  const recordar = document.getElementById("recordar").checked;
  (recordar ? localStorage : sessionStorage).setItem("sesion", sesion);

  window.location.href = "dashboard.html";
});

// Enlace de contraseña olvidada (sin recuperación real en este proyecto)
document.getElementById("olvido").addEventListener("click", (evento) => {
  evento.preventDefault();
  errorGeneral.textContent = "Para recuperar tu contraseña, comunícate con el administrador del sistema.";
  errorGeneral.hidden = false;
});

// Si ya hay una sesión guardada, ir directo al panel
if (localStorage.getItem("sesion") || sessionStorage.getItem("sesion")) {
  window.location.href = "dashboard.html";
}
