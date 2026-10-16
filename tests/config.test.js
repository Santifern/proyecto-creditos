'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validarConfig } = require('../tools/validar-config');

const INSTANCIAS = path.join(__dirname, '..', 'instancias');
const leer = dir => JSON.parse(fs.readFileSync(path.join(INSTANCIAS, dir, 'config.json'), 'utf8'));

test('la config del DEI es válida', () => {
  assert.deepEqual(validarConfig(leer('DEI')), []);
});

test('la plantilla solo falla por valores COMPLETAR y por el esquema sin revisar', () => {
  const errores = validarConfig(leer('_ejemplo'));
  assert.ok(errores.length > 0);
  assert.ok(errores.every(e => /sin completar|esquema\.revisado/.test(e)), errores.join('\n'));
});

test('la plantilla completada es válida', () => {
  const config = JSON.parse(JSON.stringify(leer('_ejemplo')), (k, v) =>
    typeof v === 'string' && v.startsWith('COMPLETAR') ? 'valor' : v);
  config.esquema.revisado = true;
  assert.deepEqual(validarConfig(config), []);
});

test('detecta límite faltante y código de categoría inválido', () => {
  const config = leer('DEI');
  delete config.esquema.categorias.A.limite;
  config.esquema.categorias.G = { nombre: 'x', limite: 1, codigoArchivo: 'G' };
  const errores = validarConfig(config);
  assert.ok(errores.some(e => /categorias\.A\.limite/.test(e)));
  assert.ok(errores.some(e => /categorias\.G: código inválido/.test(e)));
});

test('detecta mínimo mayor al límite y código de archivo repetido', () => {
  const config = leer('DEI');
  config.esquema.categorias.E.minimo = 20;
  config.esquema.categorias.F.codigoArchivo = 'C';
  const errores = validarConfig(config);
  assert.ok(errores.some(e => /E\.minimo no puede superar/.test(e)));
  assert.ok(errores.some(e => /codigoArchivo "C" repetido/.test(e)));
});
