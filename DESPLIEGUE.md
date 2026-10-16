# Despliegue

## Requisitos (una vez por máquina)

```bash
npm i -g @google/clasp
clasp login          # con la cuenta que va a ser DUEÑA de la instancia (idealmente institucional)
```
En https://script.google.com/home/usersettings hay que activar "Google Apps Script API".

## Instancia nueva (DAS, DIS, DA)

1. **Hoja**: crear la Sheet según `plantilla-hoja/estructura.md`, cargar los alumnos (A, B, C) y la fórmula de D.
2. **Drive**: crear la carpeta padre de alumnos, idealmente en un Shared Drive de la dirección, y copiar su ID.
3. **Proyectos Apps Script** (dos):
   - **Carga**, vinculado a la hoja: en la Sheet, `Extensiones → Apps Script`. Copiar el *ID de secuencia de comandos* (Configuración del proyecto).
   - **Consulta**: `clasp create --type webapp --title "Consulta Créditos DAS"` o, también vinculado a la hoja, por el mismo camino que Carga.
   - Crear `instancias/DAS/.clasp-carga.json` y `.clasp-consulta.json` con `{"scriptId": "<ID>"}`.
4. **Config**: completar `instancias/DAS/config.json` (todos los `COMPLETAR…`, el ID de la carpeta y, si Consulta es standalone, `infra.spreadsheetId`). Revisar límites, mínimos y total con el reglamento de la dirección y poner `esquema.revisado: true`.
5. **Build y push**:
   ```bash
   npm test
   node tools/build.js DAS --push todo
   ```
6. **Implementar**:
   - Carga: abrir la Sheet → recargar → menú "Gestión de Créditos" → autorizar permisos. Publicarla como Web App solo si hace falta (queda con acceso `DOMAIN`).
   - Consulta: en el editor, `Implementar → Nueva implementación → Aplicación web`. Copiar la URL `/exec` y publicarla en el sitio de la dirección.
7. **Regresión**: correr el checklist de abajo con un alumno de prueba.

## Actualizar una instancia ya en uso

```bash
git pull && npm test
node tools/build.js DAS --push carga      # ⚠ Carga vinculada a la hoja = producción inmediata
node tools/build.js DAS --push consulta   # solo afecta /dev hasta actualizar la implementación
```
- **Carga** corre siempre la última versión pusheada: hacerlo en horario de bajo uso. Rollback: `git checkout <tag-anterior>` + push.
- **Consulta**: probar la URL `/dev` y después `Implementar → Gestionar implementaciones → editar la existente → Versión nueva`. **No crear una implementación nueva**: cambiaría la URL `/exec`. Rollback: volver a la versión anterior en esa misma pantalla.
- Antes de cada actualización en producción conviene crear un tag: `git tag DAS-2026-10-15`.

## Migrar el DEI a esta plantilla (cuando se decida)

1. `clasp clone` de los proyectos reales de Carga y Consulta del DEI en una carpeta temporal, y diff contra `legacy/`: confirmar que el espejo coincide con producción.
2. `Archivo → Hacer una copia` de la Sheet del DEI → staging. Copiar también Consulta en un proyecto aparte, apuntado a la copia (`infra.spreadsheetId`).
3. Revisar `CAMBIOS.md`, sobre todo los ítems marcados **UI / Hoja / Contrato / Despliegue**, y avisar a los administrativos.
4. Correr la regresión completa en staging.
5. En producción, en una ventana de bajo uso: push de Carga y Consulta, y actualizar la implementación existente de Consulta.
6. **No tocar** el proyecto de la librería `gestionCreditosDEI`: está en `developmentMode` y la Consulta actual depende de ella hasta que se complete la migración.

## Checklist de regresión

**Carga** (modal desde la hoja):
- [ ] Categoría A con 2 créditos → la celda F suma y el PDF queda como `2 (dos) C-<mat>.pdf` en la carpeta del alumno
- [ ] Alumno sin carpeta → se crea `MAT-Nombre` en la carpeta padre y el enlace queda en M
- [ ] Exceso (D con 1.5 + 1) → asigna 0.5, muestra "LÍMITE ALCANZADO" y queda una fila en AUDITORIA
- [ ] Categoría llena → error y ninguna escritura ni archivo
- [ ] SI → "Aprobado" en E; AP → solo el archivo
- [ ] Matrícula con ceros a la izquierda; 2.5 créditos; 1.3 créditos (debe rechazar)
- [ ] Dos pestañas cargando al mismo alumno y categoría a la vez → la suma final es correcta

**Consulta**:
- [ ] Matrícula existente e inexistente; apellido con tilde; apellido con más de 5 resultados (paginación)
- [ ] Vista simplificada y completa, en escritorio y en móvil
- [ ] Exportar a PDF; "Ver detalles" abre la carpeta
- [ ] Los valores por categoría coinciden con la hoja (D = columna I, E = columna J)
- [ ] La pasantía por debajo del mínimo muestra "Faltan N para el mínimo"
