/**
 * Página de consulta de créditos (pública)
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Page')
    .evaluate()
    .setTitle('Consulta Créditos DEI')
    .setFaviconUrl('https://uc.edu.py/favicon.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Script principal de Google Apps Script para el Sistema de Créditos DEI
 * Este archivo solo contiene código que se ejecuta en el servidor
 * Utiliza la biblioteca gestionCreditosDEI para las funciones de búsqueda
 */

/**
 * Busca créditos por matrícula
 * @param {string} matricula - Matrícula del estudiante
 * @return {Object} - Datos de créditos encontrados
 */
function buscarCreditos(matricula) {
  try {
    // Intentar usar la biblioteca gestionCreditosDEI
    var resultado = gestionCreditosDEI.buscarCreditos(matricula);
    return resultado;
  } catch (e) {
    // Si la biblioteca no está disponible, devolver un error adecuado
    console.error("Error en buscarCreditos:", e);
    return {
      error: true,
      mensaje: "No se pudo realizar la búsqueda. Por favor, contacte al administrador.",
      detalles: e.toString()
    };
  }
}

/**
 * Busca créditos por apellido
 * @param {string} apellido - Apellido del estudiante
 * @return {Array} - Lista de datos de créditos encontrados
 */
function buscarCreditosPorApellido(apellido) {
  try {
    // Intentar usar la biblioteca gestionCreditosDEI
    var resultado = gestionCreditosDEI.buscarCreditosPorApellido(apellido);
    return resultado;
  } catch (e) {
    // Si la biblioteca no está disponible, devolver un error adecuado
    console.error("Error en buscarCreditosPorApellido:", e);
    return {
      error: true,
      mensaje: "No se pudo realizar la búsqueda. Por favor, contacte al administrador.",
      detalles: e.toString()
    };
  }
}

/**
 * Función principal que se ejecuta cuando se accede a la aplicación web
 * @return {HtmlOutput} - Página HTML renderizada
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile('Page')
    .evaluate()
    .setTitle('Consulta de Créditos DEI')
    .setFaviconUrl('https://uc.edu.py/favicon.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return template;
}

/**
 * Incluye archivos HTML como plantillas.
 * @param {string} filename - Nombre del archivo a incluir
 * @return {string} - Contenido HTML del archivo
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


