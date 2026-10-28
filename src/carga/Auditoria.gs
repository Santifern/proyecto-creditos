/**
 * Registro de auditoría en una hoja aparte (append-only).
 *
 * Reemplaza el esquema anterior, que escribía en getLastColumn()+1 de la hoja
 * de créditos y agregaba una columna nueva por cada carga.
 */

const ENCABEZADOS_AUDITORIA = ['Fecha', 'Usuario', 'Matrícula', 'Categoría', 'Solicitados', 'Asignados', 'Límite', 'Archivo', 'Observación'];

function obtenerHojaAuditoria() {
  const libro = obtenerLibro();
  const nombre = CONFIG.infra.nombreHojaAuditoria;
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(ENCABEZADOS_AUDITORIA);
    hoja.setFrozenRows(1);
  }
  // Texto plano para que Sheets no convierta "0000003" en 3. Se aplica siempre
  // para corregir también hojas creadas antes de este cambio.
  const columnaMatricula = ENCABEZADOS_AUDITORIA.indexOf('Matrícula') + 1;
  hoja.getRange(1, columnaMatricula, hoja.getMaxRows(), 1).setNumberFormat('@');
  return hoja;
}

/**
 * @param {{matricula:string, categoria:string, solicitados:?number, asignados:?number, limite:?number, archivo:string, observacion:string}} registro
 */
function registrarAuditoria(registro) {
  let usuario = '';
  try {
    usuario = Session.getActiveUser().getEmail();
  } catch (e) {
    // Sin email disponible (p. ej. usuario fuera del dominio): se registra vacío.
  }
  obtenerHojaAuditoria().appendRow([
    new Date(),
    usuario,
    registro.matricula,
    registro.categoria,
    registro.solicitados == null ? '' : registro.solicitados,
    registro.asignados == null ? '' : registro.asignados,
    registro.limite == null ? '' : registro.limite,
    registro.archivo || '',
    registro.observacion || ''
  ]);
}
