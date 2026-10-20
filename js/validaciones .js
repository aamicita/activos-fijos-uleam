/* ==========================================================
   validaciones.js - Reglas de validación reutilizables.
   Cada función devuelve "" si el dato es válido, o el texto
   del error si no lo es. Se irá ampliando en cada pantalla.
   ========================================================== */

const Validaciones = {

  /* Expresiones regulares ----------------------------------
     Usuario:  letras, un punto y letras      -> maria.zambrano
     Clave:    mínimo 8, con letra y número   -> Admin2026
     Código:   AF-año(4 dígitos)-número(3)    -> AF-2024-001   (se usa en "Registrar")
     Valor:    número con hasta 2 decimales   -> 1250.50       (se usa en "Registrar")  */
  patrones: {
    usuario: /^[a-záéíóúñ]+\.[a-záéíóúñ]+$/i,
    clave: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
    codigo: /^AF-\d{4}-\d{3}$/,
    valor: /^\d+(\.\d{1,2})?$/,
    nombreActivo: /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.,\-\/"'()]{2,79}$/,
    responsable: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.,\-]{2,59}$/,
    fecha: /^\d{4}-\d{2}-\d{2}$/
  },

  usuario(texto) {
    const dato = texto.trim();
    if (dato === "") return "Ingresa tu usuario.";
    if (!this.patrones.usuario.test(dato)) {
      return "Usa el formato nombre.apellido, solo letras y un punto.";
    }
    return "";
  },

  clave(texto) {
    if (texto === "") return "Ingresa tu contraseña.";
    if (!this.patrones.clave.test(texto)) {
      return "Mínimo 8 caracteres, con al menos una letra y un número.";
    }
    return "";
  },

  /* ---- Formulario de registro de activos ---- */

  nombreActivo(texto) {
    const dato = texto.trim();
    if (dato === "") return "Ingresa el nombre del activo.";
    if (!this.patrones.nombreActivo.test(dato)) {
      return "Entre 3 y 80 caracteres: letras, números y signos simples.";
    }
    return "";
  },

  codigo(texto) {
    const dato = texto.trim();
    if (dato === "") return "Ingresa el código del activo.";
    if (!this.patrones.codigo.test(dato)) {
      return "Usa el formato AF-año-número, por ejemplo AF-2024-001.";
    }
    return "";
  },

  categoria(valor) {
    return valor === "" ? "Selecciona una categoría." : "";
  },

  valor(texto) {
    // Se acepta coma o punto como separador decimal
    const dato = texto.trim().replace(",", ".");
    if (dato === "") return "Ingresa el valor del activo.";
    if (!this.patrones.valor.test(dato)) {
      return "Escribe solo números, con hasta 2 decimales (ej. 1250.50).";
    }
    if (Number(dato) > 1000000) return "El valor no puede superar 1,000,000.";
    return "";
  },

  fecha(texto) {
    if (texto === "") return "Selecciona la fecha de adquisición.";
    if (!this.patrones.fecha.test(texto)) return "La fecha no es válida.";
    if (texto > Utiles.hoyISO()) return "La fecha no puede ser posterior a hoy.";
    if (texto < "1990-01-01") return "Ingresa una fecha desde 1990 en adelante.";
    return "";
  },

  estado(valor) {
    return valor === "" ? "Selecciona un estado." : "";
  },

  responsable(texto) {
    const dato = texto.trim();
    if (dato === "") return "Ingresa el responsable o departamento.";
    if (!this.patrones.responsable.test(dato)) {
      return "Entre 3 y 60 caracteres, solo letras, espacios y signos simples.";
    }
    return "";
  }
};
