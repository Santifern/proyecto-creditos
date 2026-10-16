#!/usr/bin/env node
/**
 * Crea TODA la infraestructura de una instancia en la cuenta con la que se hizo `clasp login`:
 *
 *   node tools/crear-instancia.js <DIR>
 *
 *   1. Sheet nueva + proyecto Apps Script de Carga vinculado a ella   (clasp create --type sheets)
 *   2. Proyecto Apps Script de Consulta                               (clasp create --type standalone)
 *   3. Guarda los IDs: instancias/<DIR>/.clasp-*.json e infra.spreadsheetId en config.json
 *   4. Build + push de ambos módulos y despliegue de Consulta
 *
 * La hoja de datos (con alumnos de prueba) y la carpeta de Drive las crea el propio script de Carga
 * al ejecutar «Inicializar entorno» desde el menú de la Sheet (Apps Script no permite hacerlo desde fuera
 * sin configurar un proyecto de Google Cloud). Es idempotente: si ya hay .clasp-*.json, reutiliza lo creado.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');

function salir(mensaje) {
  console.error(`✖ ${mensaje}`);
  process.exit(1);
}

function correr(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: true });
  const salida = `${r.stdout || ''}${r.stderr || ''}`;
  if (salida.trim()) console.log(salida.trim());
  if (r.status !== 0) salir(`falló: ${cmd} ${args.join(' ')}`);
  return salida;
}

function verificarClasp() {
  const r = spawnSync('clasp', ['--version'], { encoding: 'utf8', shell: true });
  if (r.status !== 0) salir('clasp no está instalado. Ejecute: npm i -g @google/clasp');
  if (!fs.existsSync(path.join(os.homedir(), '.clasprc.json'))) {
    salir('No hay sesión de clasp. Ejecute: clasp login   (y active la Apps Script API en https://script.google.com/home/usersettings)');
  }
}

function build(dir) {
  correr('node', [path.join('tools', 'build.js'), dir], RAIZ);
}

function archivoClasp(dir, modulo) {
  return path.join(RAIZ, 'instancias', dir, `.clasp-${modulo}.json`);
}

function extraer(salida, regex, que) {
  const m = salida.match(regex);
  if (!m) salir(`No pude leer ${que} de la salida de clasp (arriba). Créelo a mano y complete instancias/<DIR>/.clasp-*.json`);
  return m[1];
}

function guardarSpreadsheetId(dir, id) {
  const archivo = path.join(RAIZ, 'instancias', dir, 'config.json');
  const texto = fs.readFileSync(archivo, 'utf8');
  if (!/"spreadsheetId"\s*:\s*"[^"]*"/.test(texto)) salir('config.json no tiene infra.spreadsheetId');
  fs.writeFileSync(archivo, texto.replace(/("spreadsheetId"\s*:\s*)"[^"]*"/, `$1"${id}"`));
}

function main() {
  const dir = process.argv[2];
  if (!dir) salir('Uso: node tools/crear-instancia.js <DIR>');
  if (!fs.existsSync(path.join(RAIZ, 'instancias', dir, 'config.json'))) salir(`No existe instancias/${dir}/config.json`);
  verificarClasp();

  const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'instancias', dir, 'config.json'), 'utf8'));
  const sigla = config.direccion.sigla;
  build(dir);
  const destino = modulo => path.join(RAIZ, 'dist', dir, modulo);

  if (!fs.existsSync(archivoClasp(dir, 'carga'))) {
    console.log('\n→ Creando la Sheet y el proyecto de Carga...');
    const out = correr('clasp', ['create', '--type', 'sheets', '--title', `"Créditos ${sigla}"`], destino('carga'));
    const scriptId = extraer(out, /script\.google\.com\/d\/([\w-]+)/, 'el ID del script de Carga');
    const hojaId = extraer(out, /(?:drive|docs)\.google\.com\/[^\s]*?(?:id=|\/d\/)([\w-]+)/, 'el ID de la Sheet');
    fs.writeFileSync(archivoClasp(dir, 'carga'), JSON.stringify({ scriptId }, null, 2) + '\n');
    guardarSpreadsheetId(dir, hojaId);
  } else {
    console.log('• Carga: ya existe instancias/' + dir + '/.clasp-carga.json, se reutiliza.');
  }

  if (!fs.existsSync(archivoClasp(dir, 'consulta'))) {
    console.log('\n→ Creando el proyecto de Consulta...');
    const out = correr('clasp', ['create', '--type', 'standalone', '--title', `"Consulta Créditos ${sigla}"`], destino('consulta'));
    const scriptId = extraer(out, /script\.google\.com\/d\/([\w-]+)/, 'el ID del script de Consulta');
    fs.writeFileSync(archivoClasp(dir, 'consulta'), JSON.stringify({ scriptId }, null, 2) + '\n');
  } else {
    console.log('• Consulta: ya existe instancias/' + dir + '/.clasp-consulta.json, se reutiliza.');
  }

  console.log('\n→ Build + push de ambos módulos...');
  correr('node', [path.join('tools', 'build.js'), dir, '--push', 'todo'], RAIZ);

  console.log('\n→ Desplegando Consulta...');
  const dep = correr('clasp', ['deploy', '--description', `"${sigla} inicial"`], destino('consulta'));
  const deployId = extraer(dep, /(AKfy[\w-]+)/, 'el ID del despliegue de Consulta');

  const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'instancias', dir, 'config.json'), 'utf8'));
  const sheetId = cfg.infra.spreadsheetId;
  console.log(`
✔ Infraestructura lista para ${sigla}

  Sheet:     https://docs.google.com/spreadsheets/d/${sheetId}/edit
  Consulta:  https://script.google.com/macros/s/${deployId}/exec

Falta un paso (solo la primera vez, requiere tu consentimiento en pantalla):
  1. Abre la Sheet y recarga la página.
  2. Menú «Gestión de Créditos» → «Inicializar entorno (solo primera vez)» → autoriza permisos.
     Crea la pestaña con 3 alumnos de prueba, la pestaña AUDITORIA y la carpeta de alumnos en tu Drive.
  3. Abre la URL de Consulta y busca la matrícula 1000001.
`);
}

main();
