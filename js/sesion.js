/* ==========================================================
   sesion.js - Se incluye en TODAS las pantallas internas
   (dashboard, activos, registrar, detalle, reportes).
   1) Si no hay sesión iniciada, regresa al inicio de sesión.
   2) Muestra el nombre y rol del usuario en el menú lateral.
   3) Hace funcionar el botón "Cerrar sesión".
   ========================================================== */

(function () {
  const guardada = sessionStorage.getItem("sesion") || localStorage.getItem("sesion");

  if (!guardada) {
    window.location.href = "index.html";
    return;
  }

  const sesion = JSON.parse(guardada);

  const nombre = document.getElementById("perfil-nombre");
  const rol = document.getElementById("perfil-rol");
  const avatar = document.getElementById("perfil-avatar");

  if (nombre) nombre.textContent = sesion.nombre;
  if (rol) rol.textContent = sesion.rol;
  if (avatar) {
    // Iniciales: primera letra de las dos primeras palabras
    avatar.textContent = sesion.nombre
      .split(" ")
      .slice(0, 2)
      .map((palabra) => palabra[0])
      .join("")
      .toUpperCase();
  }

  const cerrar = document.getElementById("cerrar-sesion");
  if (cerrar) {
    cerrar.addEventListener("click", (evento) => {
      evento.preventDefault();
      sessionStorage.removeItem("sesion");
      localStorage.removeItem("sesion");
      window.location.href = "index.html";
    });
  }
})();
