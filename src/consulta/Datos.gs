/**
 * Búsquedas de Consulta. Reemplazan a la librería externa gestionCreditosDEI
 * (buscarCreditos / buscarCreditosPorApellido), que ya no es una dependencia.
 *
 * Ambos endpoints devuelven { ok, data: Array<resumenAlumno>, error }. Si no
 * hay resultados, data es un array vacío.
 */

function buscarCreditos(matricula) {
  try {
    controlarFrecuencia();
    if (!esMatriculaValida(matricula)) {
      return respuestaError('La matrícula debe ser alfanumérica (contener solo letras y números).');
    }
    const buscada = normalizarMatricula(matricula);
    const { filas } = leerFilasAlumnos(obtenerHojaCreditos());
    const fila = filas.find(f => normalizarMatricula(valorDeColumna(f, COLUMNAS.MATRICULA)) === buscada);
    return respuestaOk(fila ? [resumenAlumno(fila, CONFIG.esquema)] : []);
  } catch (e) {
    if (e.esLimite) return respuestaError(e.message);
    console.error('buscarCreditos:', e);
    return respuestaError('No se pudo realizar la búsqueda. Por favor, contacte al administrador.');
  }
}

/** Busca por coincidencia parcial en la columna de nombre (sin acentos ni mayúsculas). */
function buscarCreditosPorApellido(apellido) {
  try {
    controlarFrecuencia();
    const termino = normalizarTexto(apellido).trim();
    if (termino.length < CONFIG.consulta.minLongitudApellido) {
      return respuestaError(`Ingrese al menos ${CONFIG.consulta.minLongitudApellido} letras para buscar por apellido.`);
    }
    const { filas } = leerFilasAlumnos(obtenerHojaCreditos());
    const resultados = filas
      .filter(f => valorDeColumna(f, COLUMNAS.NOMBRE) && normalizarTexto(valorDeColumna(f, COLUMNAS.NOMBRE)).indexOf(termino) !== -1)
      .map(f => resumenAlumno(f, CONFIG.esquema));
    return respuestaOk(resultados);
  } catch (e) {
    if (e.esLimite) return respuestaError(e.message);
    console.error('buscarCreditosPorApellido:', e);
    return respuestaError('No se pudo realizar la búsqueda. Por favor, contacte al administrador.');
  }
}

/**
 * Límite grueso de búsquedas por minuto para toda la Web App. Con acceso
 * anónimo no hay forma de identificar al visitante, así que el límite es
 * global: frena el scraping masivo sin afectar el uso normal.
 */
function controlarFrecuencia() {
  const maximo = CONFIG.consulta.maxBusquedasPorMinuto;
  if (!maximo) return;
  const cache = CacheService.getScriptCache();
  const clave = 'busquedas-' + Math.floor(Date.now() / 60000);
  const cantidad = Number(cache.get(clave) || 0) + 1;
  cache.put(clave, String(cantidad), 120);
  if (cantidad > maximo) {
    const error = new Error('Demasiadas búsquedas en este momento. Intente nuevamente en un minuto.');
    error.esLimite = true;
    throw error;
  }
}
