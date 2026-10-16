#!/usr/bin/env node
/**
 * Genera el código desplegable de una instancia.
 *
 *   node tools/build.js <DIR>                     → dist/<DIR>/carga y dist/<DIR>/consulta
 *   node tools/build.js <DIR> --push carga        → build + clasp push del módulo Carga
 *   node tools/build.js <DIR> --push consulta
 *   node tools/build.js <DIR> --push todo
 *
 * Toma src/compartido + src/<módulo>, inyecta Config.gs desde
 * instancias/<DIR>/config.json y ajusta appsscript.json. Si existe
 * instancias/<DIR>/.clasp-<módulo>.json, lo copia como .clasp.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { validarConfig } = require('./validar-config');

const RAIZ = path.resolve(__dirname, '..');
const MODULOS = ['carga', 'consulta'];

function salir(mensaje) {
  console.error(`✖ ${mensaje}`);
  process.exit(1);
}

function leerConfig(dir) {
  const archivo = path.join(RAIZ, 'instancias', dir, 'config.json');
  if (!fs.existsSync(archivo)) salir(`No existe ${path.relative(RAIZ, archivo)}`);
  let config;
  try {
    config = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  } catch (e) {
    salir(`${path.relative(RAIZ, archivo)} no es JSON válido: ${e.message}`);
  }
  const errores = validarConfig(config);
  if (errores.length) salir(`Config inválida (${dir}):\n  - ${errores.join('\n  - ')}`);
  return config;
}

function copiarCarpeta(origen, destino) {
  for (const nombre of fs.readdirSync(origen)) {
    fs.copyFileSync(path.join(origen, nombre), path.join(destino, nombre));
  }
}

function generarConfigGs(config, dir) {
  return [
    '/**',
    ` * GENERADO por tools/build.js desde instancias/${dir}/config.json.`,
    ' * No editar: los cambios se pierden en el próximo build.',
    ' */',
    `const CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});`,
    ''
  ].join('\n');
}

function construirModulo(dir, modulo, config) {
  const destino = path.join(RAIZ, 'dist', dir, modulo);
  fs.rmSync(destino, { recursive: true, force: true });
  fs.mkdirSync(destino, { recursive: true });

  copiarCarpeta(path.join(RAIZ, 'src', 'compartido'), destino);
  copiarCarpeta(path.join(RAIZ, 'src', modulo), destino);
  fs.writeFileSync(path.join(destino, 'Config.gs'), generarConfigGs(config, dir));

  const manifiestoPath = path.join(destino, 'appsscript.json');
  const manifiesto = JSON.parse(fs.readFileSync(manifiestoPath, 'utf8'));
  manifiesto.timeZone = config.infra.timeZone;
  manifiesto.webapp.access = modulo === 'carga' ? config.webapp.cargaAccess : config.webapp.consultaAccess;
  fs.writeFileSync(manifiestoPath, JSON.stringify(manifiesto, null, 2) + '\n');

  const clasp = path.join(RAIZ, 'instancias', dir, `.clasp-${modulo}.json`);
  if (fs.existsSync(clasp)) {
    const datos = JSON.parse(fs.readFileSync(clasp, 'utf8'));
    datos.rootDir = '';
    fs.writeFileSync(path.join(destino, '.clasp.json'), JSON.stringify(datos, null, 2) + '\n');
  }
  console.log(`✔ ${path.relative(RAIZ, destino)}`);
  return destino;
}

function push(destino) {
  if (!fs.existsSync(path.join(destino, '.clasp.json'))) {
    salir(`Falta .clasp.json en ${path.relative(RAIZ, destino)}: cree instancias/<DIR>/.clasp-<módulo>.json con {"scriptId": "..."}`);
  }
  const r = spawnSync('clasp', ['push', '--force'], { cwd: destino, stdio: 'inherit', shell: true });
  if (r.status !== 0) salir(`clasp push falló en ${path.relative(RAIZ, destino)}`);
}

function main() {
  const [dir, flag, objetivo] = process.argv.slice(2);
  if (!dir) salir('Uso: node tools/build.js <DIR> [--push carga|consulta|todo]');

  const config = leerConfig(dir);
  const destinos = {};
  for (const modulo of MODULOS) destinos[modulo] = construirModulo(dir, modulo, config);

  if (flag === '--push') {
    const modulos = objetivo === 'todo' ? MODULOS : [objetivo];
    for (const modulo of modulos) {
      if (!destinos[modulo]) salir(`Módulo desconocido: ${objetivo}`);
      push(destinos[modulo]);
    }
  }
}

main();
