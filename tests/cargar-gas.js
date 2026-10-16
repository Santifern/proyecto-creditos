'use strict';
/**
 * Carga archivos .gs (funciones globales de Apps Script) en un contexto de
 * Node para poder testear la lógica pura sin desplegar.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function cargarGas(archivos, globales = {}) {
  const contexto = vm.createContext({ console, ...globales });
  const raiz = path.resolve(__dirname, '..', 'src');
  // const/let de nivel superior no quedan como propiedades del contexto:
  // se concatenan y se exponen explícitamente al final.
  const codigo = archivos.map(a => fs.readFileSync(path.join(raiz, a), 'utf8')).join('\n');
  const nombres = [...codigo.matchAll(/^(?:function|const)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  vm.runInContext(codigo, contexto);
  return vm.runInContext(`({ ${nombres.join(', ')} })`, contexto);
}

module.exports = { cargarGas };
