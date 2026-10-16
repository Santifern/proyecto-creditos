'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { cargarGas } = require('./cargar-gas');

const gas = cargarGas(['compartido/Esquema.gs', 'compartido/Util.gs', 'compartido/Reglas.gs']);
const configDEI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'instancias', 'DEI', 'config.json'), 'utf8'));
const esquema = configDEI.esquema;

test('normalizarMatricula quita ceros, espacios y pasa a mayúsculas', () => {
  assert.equal(gas.normalizarMatricula(' 00y08376 '), 'Y08376');
  assert.equal(gas.normalizarMatricula(null), '');
  assert.equal(gas.normalizarMatricula(12345), '12345');
});

test('esMatriculaValida', () => {
  assert.equal(gas.esMatriculaValida('Y08376'), true);
  assert.equal(gas.esMatriculaValida('Y-08'), false);
  assert.equal(gas.esMatriculaValida(''), false);
});

test('normalizarTexto quita acentos y ñ', () => {
  assert.equal(gas.normalizarTexto('Núñez GÓMEZ'), 'nunez gomez');
});

test('extraerFolderId acepta los tres formatos', () => {
  assert.equal(gas.extraerFolderId('https://drive.google.com/drive/folders/1AbC_def-123?usp=sharing'), '1AbC_def-123');
  assert.equal(gas.extraerFolderId('https://drive.google.com/open?id=1AbCdefGhijKlmnOpqrsTuv'), '1AbCdefGhijKlmnOpqrsTuv');
  assert.equal(gas.extraerFolderId('1AbCdefGhijKlmnOpqrsTuvWx'), '1AbCdefGhijKlmnOpqrsTuvWx');
  assert.equal(gas.extraerFolderId(''), null);
  assert.equal(gas.extraerFolderId('Ver documentos'), null);
});

test('escaparHTML', () => {
  assert.equal(gas.escaparHTML(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
});

test('columnas: D→I (Extensión) y E→J (Pasantías), como escribe Carga', () => {
  assert.equal(gas.columnaDeCategoria('A'), 6);
  assert.equal(gas.columnaDeCategoria('C'), 8);
  assert.equal(gas.columnaDeCategoria('D'), 9);
  assert.equal(gas.columnaDeCategoria('E'), 10);
  assert.equal(gas.columnaDeCategoria('F'), 11);
  assert.throws(() => gas.columnaDeCategoria('G'));
});

test('obtenerCategoria distingue numéricas, especiales y desconocidas', () => {
  assert.equal(gas.obtenerCategoria(esquema, 'A').tipo, 'numerica');
  assert.equal(gas.obtenerCategoria(esquema, 'SI').tipo, 'especial');
  assert.equal(gas.obtenerCategoria(esquema, 'Z'), null);
  const sinSI = { ...esquema, especiales: { SI: { nombre: 'x', habilitada: false } } };
  assert.equal(gas.obtenerCategoria(sinSI, 'SI'), null);
});

test('validarCreditosSolicitados', () => {
  assert.equal(gas.validarCreditosSolicitados('2.5', 0.5), 2.5);
  assert.equal(gas.validarCreditosSolicitados('2,5', 0.5), 2.5);
  assert.throws(() => gas.validarCreditosSolicitados('0', 0.5));
  assert.throws(() => gas.validarCreditosSolicitados('abc', 0.5));
  assert.throws(() => gas.validarCreditosSolicitados('1.3', 0.5), /múltiplos/);
});

test('calcularAsignacion dentro del límite', () => {
  assert.deepEqual({ ...gas.calcularAsignacion(2, 3, 12) }, { asignar: 3, recortado: false, totalCategoria: 5 });
});

test('calcularAsignacion recorta al límite', () => {
  assert.deepEqual({ ...gas.calcularAsignacion(1.5, 1, 2) }, { asignar: 0.5, recortado: true, totalCategoria: 2 });
});

test('calcularAsignacion rechaza si la categoría está llena', () => {
  assert.throws(() => gas.calcularAsignacion(2, 1, 2), /No se pueden agregar más/);
});

test('numeroEnPalabras', () => {
  assert.equal(gas.numeroEnPalabras(0), 'cero');
  assert.equal(gas.numeroEnPalabras(2), 'dos');
  assert.equal(gas.numeroEnPalabras(21), 'veintiuno');
  assert.equal(gas.numeroEnPalabras(35), 'treinta y cinco');
  assert.equal(gas.numeroEnPalabras(100), 'cien');
  assert.equal(gas.numeroEnPalabras(101), 'ciento uno');
  assert.equal(gas.numeroEnPalabras(2.5), 'dos coma cinco');
  assert.equal(gas.numeroEnPalabras(0.5), 'cero coma cinco');
});

test('nombreArchivo', () => {
  const a = gas.obtenerCategoria(esquema, 'A');
  const si = gas.obtenerCategoria(esquema, 'SI');
  assert.equal(gas.nombreArchivo(a, 2, 'Y08376', 'certificado.PDF'), '2 (dos) C-Y08376.PDF');
  assert.equal(gas.nombreArchivo(a, 2.5, 'Y08376', 'sin-extension'), '2.5 (dos coma cinco) C-Y08376.pdf');
  assert.equal(gas.nombreArchivo(si, null, 'Y08376', 'x.pdf'), 'SI-Y08376.pdf');
});

test('siEstaAprobado acepta las variantes históricas', () => {
  ['Aprobado', 'SÍ', 'si', 'TRUE', '1', 'yes'].forEach(v => assert.equal(gas.siEstaAprobado(v), true, v));
  ['', 'No aprobado', 'no', null].forEach(v => assert.equal(gas.siEstaAprobado(v), false, String(v)));
});

function fila(valores) {
  const f = new Array(13).fill('');
  Object.keys(valores).forEach(col => { f[Number(col) - 1] = valores[col]; });
  return f;
}

test('resumenAlumno lee las columnas correctas y calcula el estado', () => {
  const r = gas.resumenAlumno(fila({ 1: 'Pérez, Ana', 2: 'Y001', 3: 'IF', 4: 21, 5: 'Aprobado', 6: 10, 7: 2, 8: 1, 9: 1, 10: 7, 11: 0, 13: 'https://drive.google.com/drive/folders/abc' }), esquema);
  assert.equal(r.nombre, 'Pérez, Ana');
  assert.deepEqual({ ...r.categorias }, { A: 10, B: 2, C: 1, D: 1, E: 7, F: 0 });
  assert.equal(r.total, 21);
  assert.equal(r.totalCompleto, true);
  assert.equal(r.siAprobado, true);
  assert.deepEqual([...r.minimosPendientes], []);
  assert.equal(r.requisitosCumplidos, true);
});

test('resumenAlumno marca mínimos pendientes y usa la suma si el total está vacío', () => {
  const r = gas.resumenAlumno(fila({ 1: 'X', 2: 'Y2', 6: 12, 7: 4, 10: 3 }), esquema);
  assert.equal(r.total, 19);
  assert.equal(r.faltan, 1);
  assert.deepEqual([...r.minimosPendientes], ['E']);
  assert.equal(r.siAprobado, false);
  assert.equal(r.requisitosCumplidos, false);
});
