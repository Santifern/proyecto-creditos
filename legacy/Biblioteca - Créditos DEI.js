//Función para busqueda de créditos por matrícula
function buscarCreditos(matricula) {
  if (!/^[a-zA-Z0-9]+$/.test(matricula)) {
    throw new Error("La matrícula debe ser alfanumérica (contener solo letras y números)");
  }

  // Normalizamos la matrícula: quitamos ceros a la izquierda y pasamos a mayúsculas
  const matriculaNormalizada = matricula.replace(/^0+/, "").toUpperCase();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CREDITOS_ACADEMICOS");
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(5, 1, lastRow - 4, 13).getValues();

  for (var i = 0; i < data.length; i++) {
    var matriculaEnFila = String(data[i][1]).replace(/^0+/, "").toUpperCase();

    if (matriculaEnFila === matriculaNormalizada) {
      return {
        nombreAlumno: data[i][0],         // Columna A
        matricula: data[i][1],            // Columna B
        enlaceAlumno: data[i][12],        // Columna M
        carrera: data[i][2],              // Columna C
        cantidadCreditoAlumnoTotal: data[i][3], // Columna D
        AprobacionSI: data[i][4],         // Columna E
        MateriasCursos: data[i][5],       // Columna F
        Congresos: data[i][6],            // Columna G
        AyudantiasPasantias: data[i][7],  // Columna H
        Investigacion: data[i][8],        // Columna I extension
        Extension: data[i][9],            // Columna J pasantia
        Otros: data[i][10],               // Columna K
      };
    }
  }

  throw new Error("Matrícula no encontrada: " + matricula);
}


// Función para búsqueda de créditos por apellido
function buscarCreditosPorApellido(apellido) {
  if (!apellido || typeof apellido !== 'string') {
    throw new Error("Apellido inválido.");
  }

  // Función para normalizar texto (eliminar acentos y convertir a minúsculas)
  function normalizar(texto) {
    var acentos = {
      'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ã': 'a',
      'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e',
      'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i',
      'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'õ': 'o',
      'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u',
      'ñ': 'n', 'ç': 'c',
      'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ā': 'A', 'Ã': 'A',
      'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Ē': 'E',
      'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I', 'Ī': 'I',
      'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Ō': 'O', 'Õ': 'O',
      'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ū': 'U',
      'Ñ': 'N', 'Ç': 'C'
    };

    return texto
      .toString()
      .toLowerCase()
      .replace(/[áàäâāã]/g, 'a')
      .replace(/[éèëêē]/g, 'e')
      .replace(/[íìïîī]/g, 'i')
      .replace(/[óòöôōõ]/g, 'o')
      .replace(/[úùüûū]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c');
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CREDITOS_ACADEMICOS");
  var data = sheet.getDataRange().getValues();
  var resultados = [];

  // Normalizar el apellido de búsqueda
  var apellidoNormalizado = normalizar(apellido);

  for (var i = 4; i < data.length; i++) {
    var apellidoAlumno = normalizar(data[i][0] || ""); // Columna A normalizada
    
    if (apellidoAlumno.indexOf(apellidoNormalizado) !== -1) {
      var creditos = {
        nombreAlumno: data[i][0], // Columna A (valor original)
        matricula: data[i][1],
        carrera: data[i][2],
        cantidadCreditoAlumnoTotal: data[i][3],
        AprobacionSI: data[i][4],
        MateriasCursos: data[i][5],
        Congresos: data[i][6],
        AyudantiasPasantias: data[i][7],
        Investigacion: data[i][8],
        Extension: data[i][9],
        Otros: data[i][10],
        enlaceAlumno: data[i][12] || ''
      };
      resultados.push(creditos);
    }
  }

  if (resultados.length === 0) {
    throw new Error("No se encontraron resultados para el apellido: " + apellido);
  }

  return resultados;
}



//devuelve un objeto de tipo HtmlOutput generado a partir de un archivo de plantilla HTML llamado 'Page'.
function doGet() {
  var template = HtmlService.createTemplateFromFile('Page');
  return template.evaluate();
}
//es una función personalizada que se utiliza para incluir el contenido de un archivo HTML en otro archivo HTML en Google Apps Script.
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

//Función obtener URL de una celda a otra.
function linkURL(reference) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var formula = SpreadsheetApp.getActiveRange().getFormula();
  var args = formula.match(/=\w+\((.*)\)/i);
  
  if (args && args.length >= 2) {
    try {
      var range = sheet.getRange(args[1]);
    } catch(e) {
      throw new Error(args[1] + ' is not a valid range');
    }

    var formulas = range.getRichTextValues();
    var output = [];
    for (var i = 0; i < formulas.length; i++) {
      var row = [];
      for (var j = 0; j < formulas[0].length; j++) {
        var cellValue = formulas[i][j].getLinkUrl();
        if (cellValue && cellValue !== '') {
          row.push(cellValue);
        } else {
          row.push('');
        }
      }
      output.push(row);
    }
    return output;
  }
  
  // Si no se cumple el formato esperado, simplemente se retorna un valor vacío
  return '';
}
//es un controlador de eventos que se ejecuta automáticamente en Google Apps Script cuando se produce un cambio en una hoja de cálculo.
function onChange(e) {
  var changeType = e.changeType;
  var sheet = e.source.getActiveSheet();
  var range = e.source.getActiveRange();
  var formula = range.getFormula();
  var functionName = 'linkURL';
  
  if (changeType === 'INSERT_ROW' && formula.indexOf(functionName) !== -1) {
    // Verificar si se insertó una nueva fila y la fórmula está presente
    var output = linkURL(formula);
    if (output !== '') {
      var numRows = output.length;
      var numColumns = output[0].length;
      
      // Determinar el rango de salida
      var startRow = range.getRow();
      var startColumn = range.getColumn();
      var outputRange = sheet.getRange(startRow, startColumn, numRows, numColumns);
      
      // Si la fila se inserta al inicio de la hoja, desplazar el rango hacia abajo
      if (startRow === 1) {
        outputRange = sheet.getRange(startRow + 1, startColumn, numRows, numColumns);
      }
      
      outputRange.setValues(output);
    }
  }
}

/**
 * Actualiza los créditos de un alumno
 * @param {Object} datosActualizar - Objeto con los datos para actualizar
 * @return {Object} - Resultado de la operación
 */
function actualizarCreditos(datosActualizar) {
  try {
    if (!datosActualizar || !datosActualizar.matricula) {
      return {
        error: true,
        mensaje: "Datos incompletos para actualizar créditos"
      };
    }
    
    // Buscar al alumno primero para verificar que existe
    var alumnoExistente;
    try {
      alumnoExistente = buscarCreditos(datosActualizar.matricula);
    } catch (e) {
      return {
        error: true,
        mensaje: "No se encontró al alumno con la matrícula: " + datosActualizar.matricula
      };
    }
    
    // Obtener la hoja de datos
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CREDITOS_ACADEMICOS");
    if (!sheet) {
      return {
        error: true,
        mensaje: "No se encontró la hoja de datos CREDITOS_ACADEMICOS"
      };
    }
    
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(5, 1, lastRow - 4, 13).getValues();
    var filaAlumno = -1;
    
    // Encontrar la fila del alumno
    for (var i = 0; i < data.length; i++) {
      var matriculaEnFila = String(data[i][1]).replace(/^0+/, "").toUpperCase();
      var matriculaBuscar = String(datosActualizar.matricula).replace(/^0+/, "").toUpperCase();
      
      if (matriculaEnFila === matriculaBuscar) {
        filaAlumno = i + 5; // +5 porque los datos comienzan en la fila 5
        break;
      }
    }
    
    if (filaAlumno === -1) {
      return {
        error: true,
        mensaje: "No se pudo encontrar la fila del alumno en la hoja de datos"
      };
    }
    
    // Actualizar la columna correspondiente según la categoría
    var columnaActualizar;
    var descripcionCategoria = "";
    
    switch (datosActualizar.categoria) {
      case "A": 
        columnaActualizar = 6; // Columna F - MateriasCursos
        descripcionCategoria = "Cursos Optativos";
        break;
      case "B": 
        columnaActualizar = 7; // Columna G - Congresos
        descripcionCategoria = "Congresos/Seminarios";
        break;
      case "C": 
        columnaActualizar = 8; // Columna H - AyudantiasPasantias
        descripcionCategoria = "Ayudantías";
        break;
      case "D": 
        columnaActualizar = 10; // Columna J - Extension
        descripcionCategoria = "Extensión";
        break;
      case "E": 
        columnaActualizar = 8; // Columna H - AyudantiasPasantias (se comparte con Ayudantías)
        descripcionCategoria = "Pasantías";
        break;
      case "F": 
        columnaActualizar = 11; // Columna K - Otros
        descripcionCategoria = "Otros";
        break;
      case "SI":
        columnaActualizar = 5; // Columna E - AprobacionSI
        descripcionCategoria = "Suficiencia en Inglés";
        sheet.getRange(filaAlumno, columnaActualizar).setValue("Aprobado");
        // No actualizamos créditos, solo marcamos como "Aprobado"
        break;
      default:
        return {
          error: true,
          mensaje: "Categoría no válida: " + datosActualizar.categoria
        };
    }
    
    // Si no es SI, actualizamos los créditos
    if (datosActualizar.categoria !== "SI" && columnaActualizar > 0) {
      var creditosActuales = parseFloat(data[filaAlumno - 5][columnaActualizar - 1]) || 0;
      var creditosNuevos = parseFloat(datosActualizar.creditos) || 0;
      var totalCreditos = creditosActuales + creditosNuevos;
      
      // Actualizar la celda con los créditos
      sheet.getRange(filaAlumno, columnaActualizar).setValue(totalCreditos);
      
      // Actualizar el total de créditos
      var totalActual = parseFloat(data[filaAlumno - 5][3]) || 0; // Columna D (índice 3)
      var nuevoTotal = totalActual + creditosNuevos;
      sheet.getRange(filaAlumno, 4).setValue(nuevoTotal); // Columna D
    }
    
    // Actualizar la columna de notas/enlaces si existe un documentoUrl
    if (datosActualizar.documentoUrl) {
      var columnaNota = 13; // Columna M - Enlace
      var notaActual = sheet.getRange(filaAlumno, columnaNota).getValue() || "";
      
      // Añadir enlace al documento
      if (notaActual && notaActual !== datosActualizar.documentoUrl) {
        // Si ya hay un enlace y es diferente, crear un nuevo texto enriquecido con el enlace
        var richText = SpreadsheetApp.newRichTextValue()
          .setText("Ver documentos")
          .setLinkUrl(datosActualizar.documentoUrl)
          .build();
        
        sheet.getRange(filaAlumno, columnaNota).setRichTextValue(richText);
      } else if (!notaActual) {
        // Si no hay enlace, crear un nuevo texto enriquecido
        var richText = SpreadsheetApp.newRichTextValue()
          .setText("Ver documentos")
          .setLinkUrl(datosActualizar.documentoUrl)
          .build();
        
        sheet.getRange(filaAlumno, columnaNota).setRichTextValue(richText);
      }
    }
    
    return {
      error: false,
      mensaje: "Créditos actualizados correctamente",
      categoria: descripcionCategoria,
      creditos: parseFloat(datosActualizar.creditos) || 0
    };
    
  } catch (e) {
    return {
      error: true,
      mensaje: "Error al actualizar créditos: " + e.toString()
    };
  }
}


