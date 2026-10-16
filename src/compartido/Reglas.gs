/**
 * Reglas de negocio de créditos. Funciones puras: reciben el esquema como
 * parámetro y no tocan Sheets ni Drive, así se pueden testear con Node
 * (ver tests/reglas.test.js).
 *
 * Por qué hay dos tipos de categoría:
 * - Las categorías numéricas (A-F) suman créditos hasta su límite. Si una
 *   carga supera el límite, se asigna solo lo que entra y el excedente queda
 *   en la auditoría: el certificado es válido, pero el reglamento no permite
 *   computar más de N créditos en esa categoría.
 * - Las especiales no suman créditos: son requisitos de aprobado/no aprobado.
 *   SI (Suficiencia en Inglés) marca "Aprobado" en la columna SI de la hoja.
 *   AP (Aprobación de Pasantía) solo archiva el documento de aprobación de la
 *   propuesta; los créditos de la pasantía se cargan después en su categoría.
 */

const VALOR_SI_APROBADO = 'Aprobado';

/**
 * Devuelve la definición de una categoría del esquema, o null si la
 * instancia no la usa.
 * @return {{codigo:string, tipo:'numerica'|'especial', def:Object}|null}
 */
function obtenerCategoria(esquema, codigo) {
  if (esquema.categorias && esquema.categorias[codigo]) {
    return { codigo, tipo: 'numerica', def: esquema.categorias[codigo] };
  }
  const especial = esquema.especiales && esquema.especiales[codigo];
  if (especial && especial.habilitada !== false) {
    return { codigo, tipo: 'especial', def: especial };
  }
  return null;
}

/** Convierte y valida la cantidad pedida. Lanza Error si no es válida. */
function validarCreditosSolicitados(valor, paso) {
  const creditos = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'));
  if (!isFinite(creditos) || creditos <= 0) {
    throw new Error('Créditos inválidos: ingrese un número mayor a 0.');
  }
  if (paso && Math.abs(creditos / paso - Math.round(creditos / paso)) > 1e-9) {
    throw new Error(`Los créditos deben ser múltiplos de ${paso}.`);
  }
  return creditos;
}

/**
 * Cuántos créditos se pueden asignar sin pasar el límite de la categoría.
 * Lanza Error si la categoría ya está completa.
 * @return {{asignar:number, recortado:boolean, totalCategoria:number}}
 */
function calcularAsignacion(actuales, solicitados, limite) {
  const base = Number(actuales) || 0;
  if (base + solicitados <= limite) {
    return { asignar: solicitados, recortado: false, totalCategoria: base + solicitados };
  }
  const disponible = limite - base;
  if (disponible <= 0) {
    throw new Error(`El alumno ya tiene ${base} créditos en esta categoría (límite: ${limite}). No se pueden agregar más.`);
  }
  return { asignar: disponible, recortado: true, totalCategoria: limite };
}

/** Número a palabras en español (enteros hasta 999 y un decimal: "dos coma cinco"). */
function numeroEnPalabras(numero) {
  const n = Math.abs(Number(numero) || 0);
  const entero = Math.floor(n);
  const decimales = Math.round((n - entero) * 100);
  let texto = enteroEnPalabras(entero);
  if (decimales > 0) {
    const decimalTexto = decimales % 10 === 0 ? enteroEnPalabras(decimales / 10) : enteroEnPalabras(decimales);
    texto += ' coma ' + decimalTexto;
  }
  return texto;
}

function enteroEnPalabras(n) {
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (n < 20) return unidades[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 2 && u > 0) return 'veinti' + unidades[u];
    return decenas[d] + (u ? ' y ' + unidades[u] : '');
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (resto === 0) return c === 1 ? 'cien' : centenas[c];
    return centenas[c] + ' ' + enteroEnPalabras(resto);
  }
  return String(n);
}

/**
 * Nombre estandarizado del archivo subido.
 * - Numéricas: "<créditos> (<en palabras>) <código>-<matrícula>.<ext>", ej. "2.5 (dos coma cinco) C-Y08376.pdf"
 * - Especiales: "<SI|AP>-<matrícula>.<ext>"
 */
function nombreArchivo(categoria, creditos, matricula, nombreOriginal) {
  const extension = (String(nombreOriginal || '').match(/\.[^.]+$/) || ['.pdf'])[0];
  const mat = String(matricula || '').trim();
  if (categoria.tipo === 'especial') {
    return `${categoria.codigo}-${mat}${extension}`;
  }
  const codigo = categoria.def.codigoArchivo || categoria.codigo;
  return `${creditos} (${numeroEnPalabras(creditos)}) ${codigo}-${mat}${extension}`;
}

/** Interpreta la celda SI. Acepta las variantes que se usaron históricamente en la hoja. */
function siEstaAprobado(valor) {
  const v = normalizarTexto(valor).trim();
  return ['si', 'yes', 'true', '1', 'aprobado'].indexOf(v) !== -1;
}

function aNumero(valor) {
  const n = parseFloat(valor);
  return isFinite(n) ? n : 0;
}

/**
 * Convierte una fila de la hoja en el resumen que muestra Consulta.
 * El estado (completo, faltantes, mínimos) se calcula acá y no en el
 * navegador, para que las reglas vivan en un solo lugar.
 */
function resumenAlumno(fila, esquema) {
  const categorias = {};
  let suma = 0;
  Object.keys(esquema.categorias).forEach(codigo => {
    const valor = aNumero(valorDeColumna(fila, columnaDeCategoria(codigo)));
    categorias[codigo] = valor;
    suma += valor;
  });

  const celdaTotal = valorDeColumna(fila, COLUMNAS.TOTAL);
  const total = celdaTotal === '' || celdaTotal == null ? suma : aNumero(celdaTotal);

  const minimosPendientes = Object.keys(esquema.categorias).filter(codigo => {
    const minimo = esquema.categorias[codigo].minimo;
    return minimo && categorias[codigo] < minimo;
  });

  const usaSI = Boolean(esquema.especiales && esquema.especiales.SI && esquema.especiales.SI.habilitada !== false);
  const siAprobado = usaSI ? siEstaAprobado(valorDeColumna(fila, COLUMNAS.SI)) : null;

  return {
    nombre: String(valorDeColumna(fila, COLUMNAS.NOMBRE) || '').trim(),
    matricula: String(valorDeColumna(fila, COLUMNAS.MATRICULA) || '').trim(),
    carrera: String(valorDeColumna(fila, COLUMNAS.CARRERA) || '').trim(),
    enlace: String(valorDeColumna(fila, COLUMNAS.ENLACE) || '').trim(),
    total,
    faltan: Math.max(esquema.totalRequerido - total, 0),
    totalCompleto: total >= esquema.totalRequerido,
    siAprobado,
    categorias,
    minimosPendientes,
    requisitosCumplidos: total >= esquema.totalRequerido && minimosPendientes.length === 0 && siAprobado !== false
  };
}
