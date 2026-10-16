/**
 * Módulo de Carga: punto de entrada y orquestación.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Gestión de Créditos')
    .addItem('Abrir Formulario de Carga', 'mostrarFormulario')
    .addSeparator()
    .addItem('Inicializar entorno (solo primera vez)', 'inicializarEntorno')
    .addToUi();
}

function crearPaginaCarga() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

function mostrarFormulario() {
  const html = crearPaginaCarga().setWidth(450).setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, 'Carga de Créditos');
}

/** Web App (opcional). El acceso se define en webapp.cargaAccess de la config. */
function doGet() {
  return crearPaginaCarga()
    .setTitle(`Carga de Créditos Académicos ${CONFIG.direccion.sigla}`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Procesa una carga del formulario: valida, asigna créditos respetando el
 * límite, guarda el certificado en la carpeta del alumno y audita.
 *
 * @param {{matricula:string, categoria:string, creditos:string, fileName:string, mimeType:string, fileData:string}} datos
 *   fileData es el archivo en base64, sin el prefijo "data:...;base64,".
 * @return {{ok:boolean, data:?{mensaje:string, advertencia:?string}, error:?string}}
 */
function procesarDatos(datos) {
  try {
    const solicitud = validarSolicitud(datos);
    const resultado = conBloqueo(() => aplicarCarga(solicitud));

    let advertencia = resultado.advertencia;
    try {
      registrarAuditoria(resultado.auditoria);
    } catch (e) {
      console.error('Auditoría:', e);
      advertencia = [advertencia, `⚠️ La carga se guardó, pero no se pudo registrar la auditoría: ${e.message}`].filter(Boolean).join(' ');
    }
    return respuestaOk({ mensaje: resultado.mensaje, advertencia: advertencia || null });
  } catch (e) {
    console.error('procesarDatos:', e);
    return respuestaError(`Error al procesar la carga: ${e.message}`);
  }
}

function validarSolicitud(datos) {
  if (!datos) throw new Error('No se recibieron datos.');
  if (!esMatriculaValida(datos.matricula)) throw new Error('La matrícula debe ser alfanumérica.');
  const categoria = obtenerCategoria(CONFIG.esquema, datos.categoria);
  if (!categoria) throw new Error(`Categoría no válida: ${datos.categoria}`);
  if (!datos.fileData) throw new Error('Falta el archivo del certificado.');

  const creditos = categoria.tipo === 'numerica'
    ? validarCreditosSolicitados(datos.creditos, CONFIG.esquema.pasoCreditos)
    : null;

  return {
    matricula: String(datos.matricula).trim(),
    categoria,
    creditos,
    blob: Utilities.newBlob(Utilities.base64Decode(datos.fileData), datos.mimeType, datos.fileName),
    nombreOriginal: String(datos.fileName || 'archivo.pdf')
  };
}

/**
 * Ejecuta fn con el lock del script, para que dos cargas simultáneas no lean
 * el mismo valor y se pisen al escribir.
 */
function conBloqueo(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('El sistema está procesando otra carga. Intente nuevamente en unos segundos.');
  }
  try {
    return fn();
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

/** Lógica de la carga; corre dentro del lock. */
function aplicarCarga(solicitud) {
  const { matricula, categoria, creditos } = solicitud;
  const hoja = obtenerHojaCreditos();
  const alumno = buscarAlumnoPorMatricula(hoja, matricula);
  if (!alumno) throw new Error(`Matrícula ${matricula} no encontrada.`);

  // 1. Calcular antes de escribir nada: si la categoría está llena, no se sube el archivo.
  let asignacion = null;
  let limite = null;
  if (categoria.tipo === 'numerica') {
    limite = categoria.def.limite;
    const actuales = aNumero(valorDeColumna(alumno.valores, columnaDeCategoria(categoria.codigo)));
    asignacion = calcularAsignacion(actuales, creditos, limite);
  }

  // 2. Archivo primero: si Drive falla, la hoja queda intacta.
  const folderId = obtenerOCrearCarpetaAlumno(hoja, alumno);
  const archivo = guardarArchivoEnCarpeta(folderId, solicitud.blob, nombreArchivo(categoria, creditos, matricula, solicitud.nombreOriginal));

  // 3. Hoja.
  if (categoria.tipo === 'numerica') {
    hoja.getRange(alumno.fila, columnaDeCategoria(categoria.codigo)).setValue(asignacion.totalCategoria);
  } else if (categoria.codigo === 'SI') {
    hoja.getRange(alumno.fila, COLUMNAS.SI).setValue(VALOR_SI_APROBADO);
  }
  // AP: solo se archiva el documento.

  const nombreGuardado = archivo.getName();
  let mensaje;
  if (categoria.tipo === 'numerica') {
    mensaje = `¡Carga exitosa! ${asignacion.asignar} Créditos (${categoria.codigo}) asignados a Matrícula ${matricula}. Archivo guardado como: ${nombreGuardado}.`;
  } else {
    mensaje = `¡Carga exitosa! ${categoria.def.nombre} (${categoria.codigo}) registrada para Matrícula ${matricula}. Archivo guardado como: ${nombreGuardado}.`;
  }
  const advertencia = asignacion && asignacion.recortado
    ? `⚠️ LÍMITE ALCANZADO: Se solicitaron ${creditos} créditos pero solo se asignaron ${asignacion.asignar} (límite categoría: ${limite}).`
    : null;

  return {
    mensaje,
    advertencia,
    auditoria: {
      matricula,
      categoria: categoria.codigo,
      solicitados: creditos,
      asignados: asignacion ? asignacion.asignar : null,
      limite,
      archivo: nombreGuardado,
      observacion: asignacion && asignacion.recortado ? 'Exceso de límite' : ''
    }
  };
}
