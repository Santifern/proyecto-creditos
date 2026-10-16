/**
 * Esquema fijo de la hoja de créditos (igual en todas las instancias).
 *
 * El layout de columnas no cambia entre direcciones: lo que cambia es el
 * significado de cada categoría (nombre, límite, mínimo), que vive en
 * CONFIG.esquema. Así una hoja nueva se crea copiando la plantilla y el
 * código no necesita saber de qué dirección se trata.
 *
 * Columnas en base 1, como las usa SpreadsheetApp.getRange().
 *
 * Nota histórica: la librería original nombraba H/I/J como
 * "AyudantiasPasantias"/"Investigacion"/"Extension", pero el módulo de Carga
 * siempre escribió C→H (Ayudantías), D→I (Extensión) y E→J (Pasantías).
 * Estos nombres reflejan lo que realmente hay en la hoja.
 */
const COLUMNAS = Object.freeze({
  NOMBRE: 1,      // A
  MATRICULA: 2,   // B
  CARRERA: 3,     // C
  TOTAL: 4,       // D - fórmula de la hoja; ningún módulo la escribe
  SI: 5,          // E - "Aprobado" cuando se carga la categoría especial SI
  CAT_A: 6,       // F
  CAT_B: 7,       // G
  CAT_C: 8,       // H
  CAT_D: 9,       // I
  CAT_E: 10,      // J
  CAT_F: 11,      // K
  // L sin uso
  ENLACE: 13      // M - URL de la carpeta de Drive del alumno
});

/** Última columna que se lee al traer una fila de alumno. */
const ULTIMA_COLUMNA_DATOS = COLUMNAS.ENLACE;

/** Categorías que suman créditos numéricos, en el orden de la hoja. */
const CODIGOS_CATEGORIA = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);

/** Categorías que no suman créditos (ver Reglas.gs para su comportamiento). */
const CODIGOS_ESPECIALES = Object.freeze(['SI', 'AP']);

function columnaDeCategoria(codigo) {
  const columna = COLUMNAS['CAT_' + codigo];
  if (!columna) throw new Error(`La categoría ${codigo} no tiene columna en la hoja.`);
  return columna;
}

/** Valor de una columna (base 1) dentro de una fila leída con getValues(). */
function valorDeColumna(fila, columna) {
  return fila[columna - 1];
}
