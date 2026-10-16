/**
 * Acceso a datos de alumnos en la hoja (módulo Carga).
 */

/**
 * Busca un alumno por matrícula.
 * @return {{fila:number, valores:Array}|null} fila es el número de fila en la hoja.
 */
function buscarAlumnoPorMatricula(hoja, matricula) {
  const buscada = normalizarMatricula(matricula);
  if (!buscada) return null;
  const { filas, filaInicio } = leerFilasAlumnos(hoja);
  for (let i = 0; i < filas.length; i++) {
    if (normalizarMatricula(valorDeColumna(filas[i], COLUMNAS.MATRICULA)) === buscada) {
      return { fila: filaInicio + i, valores: filas[i] };
    }
  }
  return null;
}

/**
 * Lista para el autocompletado del formulario. Solo devuelve lo que se
 * muestra (sin el enlace de Drive): la carpeta destino se resuelve en el
 * servidor al procesar la carga.
 */
function getAllStudents() {
  try {
    const { filas } = leerFilasAlumnos(obtenerHojaCreditos());
    const alumnos = filas
      .map(fila => ({
        matricula: String(valorDeColumna(fila, COLUMNAS.MATRICULA) || '').trim(),
        nombre: String(valorDeColumna(fila, COLUMNAS.NOMBRE) || '').trim(),
        carrera: String(valorDeColumna(fila, COLUMNAS.CARRERA) || '').trim()
      }))
      .filter(alumno => alumno.matricula);
    return respuestaOk(alumnos);
  } catch (e) {
    console.error('getAllStudents:', e);
    return respuestaError(e.message);
  }
}
