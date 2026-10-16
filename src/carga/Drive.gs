/**
 * Carpetas y archivos de alumnos en Google Drive.
 */

/**
 * Devuelve el ID de la carpeta del alumno. Si la hoja no tiene un enlace
 * válido, crea "<MATRÍCULA>-<Nombre>" dentro de la carpeta padre de la
 * instancia y guarda el enlace en la columna ENLACE.
 */
function obtenerOCrearCarpetaAlumno(hoja, alumno) {
  const folderId = extraerFolderId(valorDeColumna(alumno.valores, COLUMNAS.ENLACE));
  if (folderId) return folderId;

  let padre;
  try {
    padre = DriveApp.getFolderById(obtenerIdCarpetaPadre());
  } catch (e) {
    // Antes se creaba en la raíz del Drive de quien desplegó, y quedaba fuera de la carpeta compartida.
    throw new Error('No se pudo acceder a la carpeta padre de Drive (infra.parentFolderId). Verifique el ID y los permisos, o ejecute «Inicializar entorno» si es una instancia nueva.');
  }

  const matricula = String(valorDeColumna(alumno.valores, COLUMNAS.MATRICULA) || '').trim();
  const nombre = String(valorDeColumna(alumno.valores, COLUMNAS.NOMBRE) || '').trim();
  const carpeta = padre.createFolder(`${matricula}-${nombre}`);
  hoja.getRange(alumno.fila, COLUMNAS.ENLACE).setValue(`https://drive.google.com/drive/folders/${carpeta.getId()}`);
  return carpeta.getId();
}

function guardarArchivoEnCarpeta(folderId, blob, nombre) {
  return DriveApp.getFolderById(folderId).createFile(blob).setName(nombre);
}
