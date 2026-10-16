/**
 * Acceso a la configuración de la instancia y a la hoja de datos.
 *
 * CONFIG lo genera tools/build.js en Config.gs a partir de
 * instancias/<DIR>/config.json: no se edita a mano.
 */

/** Libro de datos: por ID si está configurado, si no la hoja contenedora (script bound). */
function obtenerLibro() {
  const id = CONFIG.infra.spreadsheetId;
  const libro = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) {
    throw new Error('No hay hoja de cálculo: configure infra.spreadsheetId o vincule el script a la hoja.');
  }
  return libro;
}

function obtenerHojaCreditos() {
  const hoja = obtenerLibro().getSheetByName(CONFIG.infra.nombreHoja);
  if (!hoja) throw new Error(`Hoja ${CONFIG.infra.nombreHoja} no encontrada.`);
  return hoja;
}

/**
 * Todas las filas de alumnos (columnas A..M).
 * @return {{filas: Array<Array>, filaInicio: number}} filaInicio es el número de fila de filas[0].
 */
function leerFilasAlumnos(hoja) {
  const filaInicio = CONFIG.hoja.filaInicioDatos;
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < filaInicio) return { filas: [], filaInicio };
  const filas = hoja.getRange(filaInicio, 1, ultimaFila - filaInicio + 1, ULTIMA_COLUMNA_DATOS).getValues();
  return { filas, filaInicio };
}

/** Parte de la configuración que puede ver el navegador (sin IDs de infraestructura). */
function configPublica() {
  return {
    direccion: CONFIG.direccion,
    esquema: CONFIG.esquema,
    consulta: CONFIG.consulta,
    faq: CONFIG.faq
  };
}

/** configPublica() lista para inyectar dentro de un <script> sin riesgo de cerrar la etiqueta. */
function configPublicaJSON() {
  return JSON.stringify(configPublica()).replace(/</g, '\\u003c');
}

/** Sobrescribe los colores del tema con los de la instancia. */
function estilosTema() {
  const color = valor => (/^#[0-9a-fA-F]{3,8}$/.test(valor || '') ? valor : null);
  const primario = color(CONFIG.tema && CONFIG.tema.colorPrimario);
  const hover = color(CONFIG.tema && CONFIG.tema.colorPrimarioHover);
  const reglas = [];
  if (primario) reglas.push(`--primary-color: ${primario};`);
  if (hover) reglas.push(`--primary-hover: ${hover}; --hover-color: ${hover};`);
  return reglas.length ? `<style>:root { ${reglas.join(' ')} }</style>` : '';
}

/** Incluye un archivo HTML dentro de una plantilla: <?!= include('styles') ?> */
function include(nombreArchivo) {
  return HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
}
