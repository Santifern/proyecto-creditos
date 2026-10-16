/**
 * Inicialización de un entorno nuevo (staging/pruebas o dirección nueva).
 *
 * La crea tools/crear-instancia.js; se ejecuta una sola vez desde el menú.
 * Es idempotente: solo crea lo que falta y nunca toca una hoja con datos.
 */

const CLAVE_CARPETA_PADRE = 'PARENT_FOLDER_ID';

/** ID de la carpeta padre de alumnos: config.json o, si está vacío, la que creó la inicialización. */
function obtenerIdCarpetaPadre() {
  return CONFIG.infra.parentFolderId || PropertiesService.getScriptProperties().getProperty(CLAVE_CARPETA_PADRE) || '';
}

function inicializarEntorno() {
  const ui = SpreadsheetApp.getUi();
  const libro = obtenerLibro();
  const informe = [];

  let hoja = libro.getSheetByName(CONFIG.infra.nombreHoja);
  if (!hoja) {
    hoja = libro.insertSheet(CONFIG.infra.nombreHoja, 0);
    armarHojaCreditos(hoja);
    informe.push(`Hoja ${CONFIG.infra.nombreHoja} creada con 3 alumnos de prueba.`);
  } else {
    informe.push(`Hoja ${CONFIG.infra.nombreHoja}: ya existía, no se modificó.`);
  }
  const porDefecto = libro.getSheetByName('Hoja 1') || libro.getSheetByName('Sheet1');
  if (porDefecto && libro.getSheets().length > 1 && porDefecto.getLastRow() === 0) libro.deleteSheet(porDefecto);

  obtenerHojaAuditoria();

  if (obtenerIdCarpetaPadre()) {
    informe.push('Carpeta de alumnos: ya configurada.');
  } else {
    const carpeta = DriveApp.createFolder(`Créditos ${CONFIG.direccion.sigla} - alumnos`);
    PropertiesService.getScriptProperties().setProperty(CLAVE_CARPETA_PADRE, carpeta.getId());
    informe.push(`Carpeta creada en tu Drive: ${carpeta.getUrl()}`);
  }

  ui.alert('Entorno listo', informe.join('\n'), ui.ButtonSet.OK);
}

function armarHojaCreditos(hoja) {
  const fila = CONFIG.hoja.filaInicioDatos;
  const nombres = CODIGOS_CATEGORIA.map(c => (CONFIG.esquema.categorias[c] || {}).nombreCorto || '');
  hoja.getRange(fila - 1, 1, 1, ULTIMA_COLUMNA_DATOS).setValues([[
    'Nombre', 'Matrícula', 'Carrera', 'Total', 'Inglés', ...nombres, '', 'Carpeta'
  ]]).setFontWeight('bold');
  hoja.getRange(1, 1).setValue(`Créditos académicos ${CONFIG.direccion.sigla}`).setFontWeight('bold').setFontSize(14);

  const alumnos = [
    ['Pérez, Juan', '1000001', 'IF'],
    ['O\'Brien, María', '1000002', 'IF'],
    ['Gómez Álvarez, Ana', '0000003', 'IF']
  ];
  alumnos.forEach((a, i) => {
    const n = fila + i;
    hoja.getRange(n, 1, 1, 3).setValues([a]);
    hoja.getRange(n, COLUMNAS.TOTAL).setFormula(`=SUM(F${n}:K${n})`);
  });
  // La matrícula con ceros a la izquierda se guarda como texto.
  hoja.getRange(fila, COLUMNAS.MATRICULA, alumnos.length, 1).setNumberFormat('@').setValues(alumnos.map(a => [a[1]]));
  hoja.setFrozenRows(fila - 1);
}
