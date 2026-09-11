const NOMBRE_HOJA = "CREDITOS_ACADEMICOS"; // Nombre de la hoja proporcionado
const BASE_COLUMNA_CREDITOS = 6; // Cat. A está en la columna 6 según indicación
const COLUMNA_A_INDEX = 65; // Código ASCII para 'A'
// ID de la carpeta padre donde se crearán las carpetas de alumnos
const PARENT_FOLDER_ID = '0Bzqt2WWKxRzAMG90aGlNWUNoYzg';

// Límites máximos de créditos por categoría
const LIMITES_CATEGORIA = {
  'A': 12,  // Cursos Optativos
  'B': 4,   // Conferencias/Congresos/Seminarios
  'C': 10,  // Ayudantías de Cátedra
  'D': 2,   // Extensión Universitaria
  'E': 10,  // Pasantías Supervisadas (Obligatorio)
  'F': 4,   // Otros
  'SI': 0,  // No aplica
  'AP': 0   // No aplica
};

/**
 * Función para crear el menú personalizado al abrir la hoja.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Gestión de Créditos')
    .addItem('Abrir Formulario de Carga', 'mostrarFormulario')
      .addToUi();
}

/**
 * Muestra el diálogo modal o la barra lateral con la Interfaz.html.
 */
function mostrarFormulario() {
    // Abrir el HTML llamado `index` (archivo `index.html`) como template para evaluar scriptlets
    const template = HtmlService.createTemplateFromFile('index');
    const html = template.evaluate().setWidth(450).setHeight(550);
    SpreadsheetApp.getUi().showModalDialog(html, 'Carga de Créditos');
}

/**
 * Permite desplegar la misma interfaz como Web App (opcional).
 */
function doGet(e) {
        const template = HtmlService.createTemplateFromFile('index');
        return template.evaluate().setTitle('Carga de Créditos Académicos');
}

/**
 * Helper para incluir archivos HTML desde plantillas: <?!= include('styles') ?>
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =========================================================================================
// FUNCIÓN DE LIBRERÍA (La estoy incluyendo aquí solo como ejemplo de cómo la usaría)
// La versión real debe estar en tu biblioteca o script principal.
// =========================================================================================

/**
 * Busca al alumno en Sheets. En un entorno real, esto llamaría a tu biblioteca.
 * La implementación aquí es simulada.
 * @param {string} matricula - Matrícula del alumno.
 * @returns {Object} {fila: number, folderId: string} o un objeto de error.
 */
function buscarInfoAlumno(matricula) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
        if (!sheet) return { error: true, mensaje: `Hoja ${NOMBRE_HOJA} no encontrada.` };

        const lastRow = sheet.getLastRow();
        if (lastRow < 5) return { error: true, mensaje: 'La hoja no contiene datos (esperado desde fila 5).' };

        // Preferir usar la librería gestionCreditosDEI si está disponible
        if (typeof gestionCreditosDEI !== 'undefined' && typeof gestionCreditosDEI.buscarCreditos === 'function') {
            try {
                const resultado = gestionCreditosDEI.buscarCreditos(matricula);
                if (!resultado) return { error: true, mensaje: 'La librería no devolvió datos.' };

                // obtener enlace de la librería (enlaceAlumno) y normalizar
                const link = String(resultado.enlaceAlumno || '').trim();
                // allow missing link (we can create folder later)
                // if (!link) return { error: true, mensaje: 'La librería no devolvió enlace del alumno.' };

                // Extraer folderId del enlace
                let folderId = null;
                let m = link.match(/folders\/([a-zA-Z0-9_-]+)/);
                if (m && m[1]) folderId = m[1];
                if (!folderId) {
                    m = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (m && m[1]) folderId = m[1];
                }
                if (!folderId) {
                    m = link.match(/[-\w]{20,}/);
                    if (m && m[0]) folderId = m[0];
                }

                // Buscar la fila en la hoja (los datos comienzan en la fila 5 según la librería)
                const COLUMNA_MATRICULA = 2; // Columna B en la hoja
                const matriculas = sheet.getRange(5, COLUMNA_MATRICULA, lastRow - 4, 1).getValues();
                const buscado = String(matricula || '').replace(/^0+/, '').toUpperCase();
                for (let i = 0; i < matriculas.length; i++) {
                    const mat = String(matriculas[i][0] || '').replace(/^0+/, '').toUpperCase();
                    if (mat === buscado) {
                        const filaSheet = i + 5;
                        // It's acceptable that folderId is null; we return fila and possible null folderId
                        return { error: false, fila: filaSheet, folderId: folderId || null };
                    }
                }
                return { error: true, mensaje: `Matrícula ${matricula} no encontrada en la hoja.` };
            } catch (libErr) {
                // Si la librería lanzó error, seguimos con fallback local
                console.warn('gestionCreditosDEI.buscarCreditos falló:', libErr.message || libErr);
            }
        }

        // Fallback: búsqueda local directa (por si la librería no está disponible)
        const COLUMNA_MATRICULA = 2; // Columna B
        const COLUMNA_ENLACE_CARPETA = 13; // Columna M
        const matriculas = sheet.getRange(5, COLUMNA_MATRICULA, lastRow - 4, 1).getValues();
        const enlaces = sheet.getRange(5, COLUMNA_ENLACE_CARPETA, lastRow - 4, 1).getValues();

        const buscado2 = String(matricula || '').replace(/^0+/, '').toUpperCase();
        for (let i = 0; i < matriculas.length; i++) {
            if (String(matriculas[i][0] || '').replace(/^0+/, '').toUpperCase() === buscado2) {
                const filaSheet = i + 5;
                const link = String(enlaces[i][0] || '').trim();
                // allow missing link: continue and return fila with null folderId
                // if (!link) return { error: true, mensaje: 'No hay enlace de carpeta para el alumno.' };

                let folderId = null;
                let m = link.match(/folders\/([a-zA-Z0-9_-]+)/);
                if (m && m[1]) folderId = m[1];
                if (!folderId) {
                    m = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (m && m[1]) folderId = m[1];
                }
                if (!folderId) {
                    m = link.match(/[-\w]{20,}/);
                    if (m && m[0]) folderId = m[0];
                }
                // folderId may be null; return fila and folderId (or null)
                return { error: false, fila: filaSheet, folderId: folderId || null };
            }
        }
        return { error: true, mensaje: `Matrícula ${matricula} no encontrada.` };

    } catch (e) {
        console.error("Error al buscar info del alumno:", e);
        throw new Error(`Error de sistema al buscar alumno: ${e.message}`);
    }
}

/**
 * Devuelve todos los alumnos (matrícula, nombre, folderUrl, carrera) para preload en la UI.
 * Devuelve un array de objetos: { matricula, nombre, folderUrl, carrera }
 */
function getAllStudents() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow < 5) return [];

    const data = sheet.getRange(5, 1, lastRow - 4, 13).getValues(); // A..M
    const out = [];
    for (let i = 0; i < data.length; i++) {
        out.push({
            matricula: String(data[i][1] || '').trim(),
            nombre: String(data[i][0] || '').trim(),
            folderUrl: String(data[i][12] || '').trim(),
            carrera: String(data[i][2] || '').trim()
        });
    }
    return out;
}
// =========================================================================================

/**
 * PROCESAMIENTO PRINCIPAL: Recibe los datos del formulario, busca al alumno,
 * actualiza Sheets y mueve el archivo a Drive.
 * @param {Object} data - Datos enviados desde Interfaz.html.
 * @returns {string} Mensaje de confirmación.
 */
function procesarDatos(data) {
    try {
    // 1. Convertir la cadena Base64 recibida en Blob
    // Se espera que client envíe `fileData` como base64 (sin el prefijo 'data:...base64,')
    const decoded = Utilities.base64Decode(data.fileData);
    const fileBlob = Utilities.newBlob(decoded, data.mimeType, data.fileName);
  
    // 2. DETERMINAR ALUMNO: si el cliente ya envió folderUrl (selección por autocompletado),
    // intentar usarla y buscar la fila localmente (evita doble lookup librería).
        let alumnoInfo = null;
        if (data.folderUrl) {
            // extraer folderId
            const link = String(data.folderUrl || '').trim();
            let folderId = null;
            let m = link.match(/folders\/([a-zA-Z0-9_-]+)/);
            if (m && m[1]) folderId = m[1];
            if (!folderId) {
                m = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (m && m[1]) folderId = m[1];
            }
            if (!folderId) {
                m = link.match(/[-\w]{20,}/);
                if (m && m[0]) folderId = m[0];
            }

            if (folderId) {
                // buscar fila por matrícula en la hoja (datos desde fila 5, columna B)
                const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
                const lastRow = sheet.getLastRow();
                if (lastRow >= 5) {
                    const matriculas = sheet.getRange(5, 2, lastRow - 4, 1).getValues();
                    const buscado = String(data.matricula || '').replace(/^0+/, '').toUpperCase();
                    for (let i = 0; i < matriculas.length; i++) {
                        const mat = String(matriculas[i][0] || '').replace(/^0+/, '').toUpperCase();
                        if (mat === buscado) {
                            alumnoInfo = { error: false, fila: i + 5, folderId: folderId };
                            break;
                        }
                    }
                }
            }
        }

        // si no quedó resuelto por folderUrl, usar la función existente que integra la librería
        if (!alumnoInfo) {
            alumnoInfo = buscarInfoAlumno(data.matricula);
        }
        if (alumnoInfo.error) {
                throw new Error(alumnoInfo.mensaje);
        }
  
    const filaAlumno = alumnoInfo.fila;
    let folderId = alumnoInfo.folderId;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);

    // Si no hay folderId, crear carpeta en Drive con formato: MATRICULA-Nombre Apellido
    if (!folderId) {
        // obtener nombre desde la hoja (filaAlumno, columna A)
        const nombre = String(sheet.getRange(filaAlumno, 1).getValue() || '').trim();
        const matriculaClean = String(data.matricula || '').trim();
        const folderName = `${matriculaClean}-${nombre}`;
            // Crear carpeta dentro de la carpeta padre especificada, si es accesible
            let newFolder = null;
            try {
                const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
                newFolder = parent.createFolder(folderName);
            } catch (e) {
                console.warn('No se pudo acceder a la carpeta padre, creando en root:', e.message);
                const parentFolder = DriveApp.getRootFolder();
                newFolder = parentFolder.createFolder(folderName);
            }
        folderId = newFolder.getId();
        // actualizar columna M (13) con el enlace de carpeta
        try {
            const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
            sheet.getRange(filaAlumno, 13).setValue(folderUrl);
        } catch (e) {
            console.warn('No se pudo actualizar enlace en hoja:', e.message);
        }
    }
  
  // 3. Determinar la columna de créditos a actualizar (A=3, B=4, C=5, etc.)
  const offset = data.categoria.charCodeAt(0) - COLUMNA_A_INDEX;
  const columnaCreditos = BASE_COLUMNA_CREDITOS + offset;

  // 4. Actualizar los créditos en la hoja
    // Inicializar variables que se usarán en el mensaje final
    let creditosAAsignar = parseFloat(data.creditos) || 0;
    let mensajeAdicional = '';
    
    // Special categories handling
    if (data.categoria === 'SI') {
        // Escribir 'Aprobado' en la columna 5 (E)
        sheet.getRange(filaAlumno, 5).setValue('Aprobado');
        creditosAAsignar = 0; // No se asignan créditos para SI
    } else if (data.categoria === 'AP') {
        // No escribir créditos ni texto; solo subir el archivo
        creditosAAsignar = 0; // No se asignan créditos para AP
    } else {
        const creditosActuales = parseFloat(sheet.getRange(filaAlumno, columnaCreditos).getValue() || 0);
        const creditosSolicitados = parseFloat(data.creditos);
        if (isNaN(creditosSolicitados)) throw new Error('Créditos inválidos.');
        
        // Verificar límite de la categoría
        const limiteCategoria = LIMITES_CATEGORIA[data.categoria] || 20;
        const nuevosCreditos = creditosActuales + creditosSolicitados;
        
        creditosAAsignar = creditosSolicitados;
        
        // Si supera el límite, asignar solo hasta el límite
        if (nuevosCreditos > limiteCategoria) {
            creditosAAsignar = limiteCategoria - creditosActuales;
            if (creditosAAsignar <= 0) {
                throw new Error(`El alumno ya tiene ${creditosActuales} créditos en esta categoría (límite: ${limiteCategoria}). No se pueden agregar más.`);
            }
            mensajeAdicional = ` ⚠️ LÍMITE ALCANZADO: Se solicitaron ${creditosSolicitados} créditos pero solo se asignaron ${creditosAAsignar} (límite categoría: ${limiteCategoria})`;
            
            // Registrar el exceso en la columna de auditoría
            registrarExcesoCreditos(filaAlumno, data.categoria, creditosSolicitados, creditosAAsignar, limiteCategoria);
        }
        
        const creditosFinales = creditosActuales + creditosAAsignar;
        sheet.getRange(filaAlumno, columnaCreditos).setValue(creditosFinales);
    }
  
  // 5. Copiar el PDF a la carpeta de Drive del alumno
        // RENOMBRAR ARCHIVO: formato "<NOMBRE_EN_PALABRAS> (<MATRICULA>) <COD> - <original>
        const categoriaCodeMap = {
            'A': 'C',
            'B': 'Co',
            'C': 'AY',
            'D': 'E',
            'E': 'Ps',
            'F': 'Ot'
        };
                const originalName = String(data.fileName || 'archivo.pdf');
                const matriculaPart = String(data.matricula || '');
                // Handle SI and AP specially: no credits to show
                let newFileName = '';
                if (data.categoria === 'SI') {
                    // Aprobación de suficiencia inglés
                    newFileName = `SI-${matriculaPart}${ (originalName.match(/\.[^.]+$/) || ['.pdf'])[0] }`;
                } else if (data.categoria === 'AP') {
                    // Aprobación de Pasantía
                    newFileName = `AP-${matriculaPart}${ (originalName.match(/\.[^.]+$/) || ['.pdf'])[0] }`;
                } else {
                    const numWords = numberToWordsES(parseFloat(data.creditos) || 0);
                    const catCode = categoriaCodeMap[String(data.categoria) || ''] || String(data.categoria || '');
                    // construir nuevo nombre: "5 (cinco) C-Y08376.pdf"
                    const extMatch = originalName.match(/\.([^.]+)$/);
                    const ext = extMatch ? extMatch[0] : '.pdf';
                    const nuevosPrefijos = `${data.creditos} (${numWords}) ${catCode}-${matriculaPart}`;
                    newFileName = `${nuevosPrefijos}${ext}`;
                }

        const targetFolder = DriveApp.getFolderById(folderId);
        const uploadedFile = targetFolder.createFile(fileBlob).setName(newFileName);

    // Opcional: registrar el nombre del archivo subido en una columna de auditoría (última columna)
    try {
        const auditCol = sheet.getLastColumn() + 1;
        sheet.getRange(filaAlumno, auditCol).setValue('Último archivo: ' + uploadedFile.getName() + ' @ ' + new Date());
    } catch (e) {
        // No crítico: si falla la auditoría, seguimos adelante
        console.warn('No se pudo escribir auditoría en hoja:', e.message);
    }
  
        // Return message adapted for special categories
        let msg = `Archivo guardado como: ${uploadedFile.getName()}.`;
        if (data.categoria === 'SI') {
            msg = `Aprobación registrada (SI) para Matrícula ${data.matricula}. ` + msg;
        } else if (data.categoria === 'AP') {
            msg = `Aprobación de Pasantía (AP) para Matrícula ${data.matricula}. ` + msg;
        } else {
            msg = `${creditosAAsignar || data.creditos} Créditos (${data.categoria}) asignados a Matrícula ${data.matricula}. ` + msg;
        }
        return `¡Carga exitosa! ${msg}${mensajeAdicional || ''}`;
  
    } catch (err) {
        console.error('Error en procesarDatos:', err);
        throw new Error('Error al procesar la carga: ' + err.message);
    }
}

/**
 * Registra cuando se solicitan más créditos de los permitidos por categoría
 */
function registrarExcesoCreditos(fila, categoria, solicitados, asignados, limite) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
    const timestamp = new Date().toLocaleString('es-ES');
    const mensaje = `${timestamp}: Categoría ${categoria} - Solicitados: ${solicitados}, Asignados: ${asignados}, Límite: ${limite}`;
    
    // Buscar una columna libre al final para registrar el exceso
    // Usar la última columna + 1, o una columna específica para auditoría de límites
    const lastCol = sheet.getLastColumn();
    const auditCol = Math.max(lastCol + 1, 15); // Mínimo columna O (15)
    
    // Escribir encabezado si es la primera vez
    const header = sheet.getRange(4, auditCol).getValue();
    if (!header) {
      sheet.getRange(4, auditCol).setValue('Excesos de Límite');
    }
    
    // Agregar el registro al final de lo que ya existe en esa celda
    const currentValue = sheet.getRange(fila, auditCol).getValue() || '';
    const newValue = currentValue ? `${currentValue}; ${mensaje}` : mensaje;
    sheet.getRange(fila, auditCol).setValue(newValue);
    
  } catch (e) {
    console.warn('Error registrando exceso de créditos:', e.message);
  }
}

// Helper: convierte números (enteros hasta 999) a palabras en español básicas
function numberToWordsES(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    const unidades = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve'];
    const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
    const centenas = ['','cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];

    if (n < 20) return unidades[n];
    if (n < 100) {
        const d = Math.floor(n/10);
        const u = n % 10;
        if (d === 2 && u > 0) return 'veinti' + unidades[u];
        return decenas[d] + (u ? ' y ' + unidades[u] : '');
    }
    if (n < 1000) {
        const c = Math.floor(n/100);
        const resto = n % 100;
        if (c === 1 && resto === 0) return 'cien';
        return (centenas[c] || '') + (resto ? ' ' + numberToWordsES(resto) : '');
    }
    return String(n);
}