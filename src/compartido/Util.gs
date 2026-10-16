/**
 * Utilidades puras (sin servicios de Apps Script): se pueden testear con Node.
 */

/** Matrícula comparable: sin espacios, sin ceros a la izquierda, en mayúsculas. */
function normalizarMatricula(matricula) {
  return String(matricula == null ? '' : matricula).trim().replace(/^0+/, '').toUpperCase();
}

function esMatriculaValida(matricula) {
  return /^[a-zA-Z0-9]+$/.test(String(matricula == null ? '' : matricula).trim());
}

/** Texto comparable para búsquedas: sin acentos ni diéresis, en minúsculas. */
function normalizarTexto(texto) {
  return String(texto == null ? '' : texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Extrae el ID de carpeta de Drive de un enlace. Acepta /folders/<id>,
 * ?id=<id> o, como último recurso, cualquier token de 20+ caracteres.
 * Devuelve null si no encuentra nada.
 */
function extraerFolderId(enlace) {
  const texto = String(enlace == null ? '' : enlace).trim();
  if (!texto) return null;
  const patrones = [/folders\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /([-\w]{20,})/];
  for (const patron of patrones) {
    const m = texto.match(patron);
    if (m && m[1]) return m[1];
  }
  return null;
}

function escaparHTML(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Contrato único de respuesta de todos los endpoints llamados con google.script.run.
 * El cliente siempre recibe { ok, data, error } en el success handler; el failure
 * handler queda solo para errores de infraestructura (timeout, permisos).
 */
function respuestaOk(data) {
  return { ok: true, data: data === undefined ? null : data, error: null };
}

function respuestaError(mensaje) {
  return { ok: false, data: null, error: String(mensaje || 'Error desconocido') };
}
