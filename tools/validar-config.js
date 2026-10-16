'use strict';

/**
 * Valida instancias/<DIR>/config.json antes de generar el build.
 * Devuelve una lista de errores legibles (vacía si la config es válida).
 */

const CATEGORIAS_VALIDAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ESPECIALES_VALIDAS = ['SI', 'AP'];
const ACCESOS_VALIDOS = ['MYSELF', 'DOMAIN', 'ANYONE', 'ANYONE_ANONYMOUS'];

function validarConfig(config) {
  const errores = [];
  const texto = (valor, ruta, opcional) => {
    if (valor === undefined && opcional) return;
    if (typeof valor !== 'string' || (!opcional && !valor.trim())) errores.push(`${ruta} debe ser un texto no vacío`);
  };
  const numeroPositivo = (valor, ruta) => {
    if (typeof valor !== 'number' || !(valor > 0)) errores.push(`${ruta} debe ser un número mayor a 0`);
  };

  if (!config || typeof config !== 'object') return ['la config debe ser un objeto JSON'];

  buscarPendientes(config, '', errores);

  const d = config.direccion || {};
  if (!config.direccion) errores.push('falta "direccion"');
  ['sigla', 'nombre', 'universidad', 'emailContacto', 'imagenCabecera'].forEach(k => texto(d[k], `direccion.${k}`));
  ['urlSitio', 'favicon', 'lema', 'carreraPorDefecto'].forEach(k => texto(d[k], `direccion.${k}`, true));

  const infra = config.infra || {};
  if (!config.infra) errores.push('falta "infra"');
  ['nombreHoja', 'nombreHojaAuditoria', 'timeZone'].forEach(k => texto(infra[k], `infra.${k}`));
  texto(infra.parentFolderId, 'infra.parentFolderId', true); // vacío: lo crea «Inicializar entorno»
  texto(infra.spreadsheetId, 'infra.spreadsheetId', true);

  if (!config.hoja || !Number.isInteger(config.hoja.filaInicioDatos) || config.hoja.filaInicioDatos < 2) {
    errores.push('hoja.filaInicioDatos debe ser un entero >= 2');
  }

  const webapp = config.webapp || {};
  ['cargaAccess', 'consultaAccess'].forEach(k => {
    if (ACCESOS_VALIDOS.indexOf(webapp[k]) === -1) errores.push(`webapp.${k} debe ser uno de: ${ACCESOS_VALIDOS.join(', ')}`);
  });

  const consulta = config.consulta || {};
  numeroPositivo(consulta.resultadosPorPagina, 'consulta.resultadosPorPagina');
  numeroPositivo(consulta.minLongitudApellido, 'consulta.minLongitudApellido');
  if (typeof consulta.maxBusquedasPorMinuto !== 'number' || consulta.maxBusquedasPorMinuto < 0) {
    errores.push('consulta.maxBusquedasPorMinuto debe ser un número >= 0 (0 desactiva el límite)');
  }

  const esquema = config.esquema;
  if (!esquema) {
    errores.push('falta "esquema"');
    return errores;
  }
  if (esquema.revisado !== true) {
    errores.push('esquema.revisado debe ser true: confirme que límites, mínimos y total corresponden al reglamento de la dirección');
  }
  numeroPositivo(esquema.totalRequerido, 'esquema.totalRequerido');
  numeroPositivo(esquema.pasoCreditos, 'esquema.pasoCreditos');

  const categorias = esquema.categorias || {};
  const codigos = Object.keys(categorias);
  if (codigos.length === 0) errores.push('esquema.categorias debe tener al menos una categoría');
  const codigosArchivo = {};
  codigos.forEach(codigo => {
    const ruta = `esquema.categorias.${codigo}`;
    if (CATEGORIAS_VALIDAS.indexOf(codigo) === -1) {
      errores.push(`${ruta}: código inválido (usar ${CATEGORIAS_VALIDAS.join(', ')}; cada uno es una columna fija de la hoja)`);
      return;
    }
    const cat = categorias[codigo];
    texto(cat.nombre, `${ruta}.nombre`);
    texto(cat.codigoArchivo, `${ruta}.codigoArchivo`);
    numeroPositivo(cat.limite, `${ruta}.limite`);
    if (cat.minimo !== undefined) {
      numeroPositivo(cat.minimo, `${ruta}.minimo`);
      if (cat.minimo > cat.limite) errores.push(`${ruta}.minimo no puede superar el límite`);
    }
    if (cat.detalles !== undefined) validarDetalles(cat.detalles, `${ruta}.detalles`, errores);
    if (cat.codigoArchivo) {
      if (codigosArchivo[cat.codigoArchivo]) errores.push(`${ruta}.codigoArchivo "${cat.codigoArchivo}" repetido en ${codigosArchivo[cat.codigoArchivo]}`);
      codigosArchivo[cat.codigoArchivo] = codigo;
    }
  });

  const especiales = esquema.especiales || {};
  Object.keys(especiales).forEach(codigo => {
    const ruta = `esquema.especiales.${codigo}`;
    if (ESPECIALES_VALIDAS.indexOf(codigo) === -1) {
      errores.push(`${ruta}: solo se admiten ${ESPECIALES_VALIDAS.join(', ')}`);
      return;
    }
    texto(especiales[codigo].nombre, `${ruta}.nombre`);
    if (especiales[codigo].detalles !== undefined) validarDetalles(especiales[codigo].detalles, `${ruta}.detalles`, errores);
  });

  if (config.faq !== undefined) {
    if (!Array.isArray(config.faq)) errores.push('faq debe ser una lista');
    else config.faq.forEach((f, i) => {
      texto(f.pregunta, `faq[${i}].pregunta`);
      texto(f.respuestaHtml, `faq[${i}].respuestaHtml`);
    });
  }

  return errores;
}

/** Marca todo texto que empiece con "COMPLETAR": son valores de la plantilla que faltan definir. */
function buscarPendientes(valor, ruta, errores) {
  if (typeof valor === 'string') {
    if (/^COMPLETAR/.test(valor)) errores.push(`${ruta || '(raíz)'} está sin completar: ${valor}`);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => buscarPendientes(v, `${ruta}[${i}]`, errores));
  } else if (valor && typeof valor === 'object') {
    Object.keys(valor).forEach(k => buscarPendientes(valor[k], ruta ? `${ruta}.${k}` : k, errores));
  }
}

function validarDetalles(detalles, ruta, errores) {
  if (!Array.isArray(detalles)) {
    errores.push(`${ruta} debe ser una lista de secciones { titulo, items }`);
    return;
  }
  detalles.forEach((s, i) => {
    if (!s || typeof s.titulo !== 'string' || !Array.isArray(s.items)) {
      errores.push(`${ruta}[${i}] debe tener "titulo" (texto) e "items" (lista)`);
    }
  });
}

module.exports = { validarConfig };
