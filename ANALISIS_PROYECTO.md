# Análisis del Sistema de Gestión de Créditos Académicos DEI

## 1. Resumen del proyecto

El repositorio contiene **dos aplicaciones Google Apps Script independientes** que juntas forman el sistema de créditos académicos del DEI (UC "Ntra. Sra. de la Asunción"):

| Módulo | Carpeta | Función | Acceso |
|---|---|---|---|
| **Carga** | `Gestion-de-creditos-academicos-Carga-main` | Formulario para que el administrativo asigne créditos por categoría (A-F, SI, AP), suba el PDF certificado y lo organice en Drive | Modal desde Sheets o Web App |
| **Consulta** | `Gestion-de-creditos-academicos-Consulta-main` | Página pública donde el alumno busca por matrícula/apellido y ve el progreso de sus créditos (20 requeridos) | Web App pública (`ANYONE_ANONYMOUS`) |

**Arquitectura:**
- Backend: Apps Script (V8 en Carga, ES5 deprecado en Consulta).
- Persistencia: una hoja de Google Sheets (`CREDITOS_ACADEMICOS`), sin base de datos real.
- Archivos: Google Drive, con carpetas por alumno creadas/vinculadas dinámicamente.
- Ambos módulos dependen de una **librería externa compartida** `gestionCreditosDEI` (Apps Script Library) para buscar alumnos — con fallback a búsqueda local por si la librería falla.
- Front-end: HTML/CSS/JS embebido en archivos `.html` de Apps Script (HtmlService), sin framework en Carga; Bootstrap 5 + jsPDF + html2canvas en Consulta.

## 2. Problemas y riesgos detectados

### Críticos
- **Sin control de concurrencia**: `procesarDatos` lee y escribe la hoja sin `LockService`. Dos cargas simultáneas sobre el mismo alumno pueden pisarse (condición de carrera clásica de Sheets).
- **Runtime ES5 deprecado** en Consulta (`appsscript.json`: `"runtimeVersion": "DEPRECATED_ES5"`) — Google puede dejar de soportarlo; migrar a V8 es trivial pero pendiente.
- **Acceso público sin autenticación** (`ANYONE_ANONYMOUS`) a datos académicos de alumnos (nombre, carrera, progreso) — solo protegido por conocer la matrícula/apellido, sin CAPTCHA ni rate limiting. Riesgo de scraping/enumeración de matrículas.
- **`getAllStudents()` expone toda la base de alumnos** (nombre, matrícula, carrera, folderUrl) al cliente en cada carga de formulario — cualquiera con acceso al modal ve el listado completo, incluso enlaces de carpetas privadas de Drive.

### Importantes
- **Doble fuente de verdad para límites de categorías**: `LIMITES_CATEGORIA` está duplicado (Código.js y dentro del `<script>` de index.html). Si se cambia uno y no el otro, la validación de UI y la del servidor divergen (el README ya lo advierte).
- **Falta de tests**: no hay ninguna prueba unitaria/integración en ninguno de los dos proyectos.
- **Manejo de errores inconsistente**: varios `catch` solo hacen `console.warn` y siguen adelante silenciosamente (ej. si falla escribir el enlace de carpeta, o la auditoría), lo que puede dejar la hoja en estado inconsistente sin que nadie se entere.
- **Columna de auditoría con `sheet.getLastColumn() + 1`**: es frágil; si dos cargas concurrentes calculan la "última columna" al mismo tiempo, pueden escribir en columnas distintas o pisarse. Además no hay migración/versión de esquema si cambia el layout de la hoja.
- **IDs y URLs de infraestructura hardcodeados** en el código fuente (`PARENT_FOLDER_ID` en Código.js, `scriptId` en `.clasp.json`, URLs de despliegue en README) — dificulta portar el proyecto a otro entorno (ej. otro Google Workspace) sin editar código.
- **Sin sistema de logs centralizado**: solo `console.log`/`console.warn` de Apps Script (Stackdriver), no hay forma de auditar desde fuera del editor.

### Menores / mejora de calidad
- **`numberToWordsES`** soporta solo hasta 999 y no maneja decimales (ej. "2.5 créditos" en palabras) — quedaría como número sin convertir en el nombre del archivo.
- **Regex de extracción de `folderId`** repetida 3 veces (en `buscarInfoAlumno` dos veces y en `procesarDatos`) — candidato claro a refactor en una función utilitaria.
- **Falta de dependencias declaradas / build**: no hay `package.json`, no hay linter, no hay CI. Cualquier error de sintaxis se detecta recién en producción (`clasp push` + probar a mano).
- **README desactualizado en un punto**: dice `LICENCIA MIT` pero no hay archivo `LICENSE` en ninguno de los dos repos.
- **Textos y emojis embebidos en el HTML generado desde JS** (concatenación de strings) en vez de templates — dificulta mantenimiento y es más propenso a errores de XSS si algún día se incorpora dato no sanitizado (hoy se usa `limpiarHTML`, que está bien, pero no es consistente en todos los campos, ej. `carrera` se inserta sin sanitizar en `construirFila`).

## 3. Recomendaciones de mejora

| Prioridad | Mejora | Motivo |
|---|---|---|
| Alta | Agregar `LockService.getScriptLock()` alrededor de las escrituras en `procesarDatos` | Evitar condiciones de carrera en Sheets |
| Alta | Migrar Consulta a runtime V8 | Evitar depreciación de Google |
| Alta | Restringir `getAllStudents()` — devolver solo lo necesario para el autocompletado (matrícula + nombre), no `folderUrl` | Minimizar exposición de datos sensibles |
| Alta | Evaluar autenticación (Google Workspace domain restriction) en vez de `ANYONE_ANONYMOUS` para Consulta, o al menos rate-limiting básico | Proteger datos de alumnos |
| Media | Unificar `LIMITES_CATEGORIA` en un único lugar (ideal: obtenerlo del servidor vía `google.script.run` al cargar el form, no duplicarlo en el HTML) | Evitar divergencia de reglas de negocio |
| Media | Extraer función utilitaria `extraerFolderId(link)` reutilizada en ambos módulos | Reducir duplicación |
| Media | Mover configuración (`PARENT_FOLDER_ID`, nombre de hoja, límites) a `PropertiesService` (Script Properties) en vez de constantes en código | Permitir reconfigurar sin tocar/redeployar código — clave para "instanciar" el proyecto en otra institución |
| Media | Agregar manejo de errores más estricto (no solo `warn`) cuando falla escritura de auditoría o de enlace de carpeta, notificando al usuario | Evitar estados silenciosamente inconsistentes |
| Baja | Agregar tests con `clasp` + un runner tipo `GasT`/`QUnit-GAS`, o extraer lógica pura (cálculo de créditos, parsing de folderId, `numberToWordsES`) a funciones testeables con Jest fuera de GAS | Calidad y confianza en refactors |
| Baja | Reemplazar generación de HTML por concatenación de strings por templates literales o un mini motor de plantillas | Legibilidad y mantenibilidad |
| Baja | Documentar y versionar el esquema de la hoja (columnas fijas) como constantes nombradas en vez de números mágicos (`5`, `13`, `15`) | Reduce errores al modificar la hoja |

## 4. Qué cambiar para "instanciar" el proyecto en otra institución/entorno

Estos son los puntos de configuración que **hay que tocar obligatoriamente** para desplegar una copia nueva (otra facultad, otra universidad, otro Google Workspace):

1. **`Código.js` (Carga)**:
   - `NOMBRE_HOJA` → nombre real de la hoja de cálculo destino.
   - `PARENT_FOLDER_ID` → ID de la carpeta de Drive donde se crean las carpetas de alumnos.
   - `LIMITES_CATEGORIA` → límites de créditos por categoría, si difieren de esta carrera.
   - `categoriaCodeMap` → códigos usados en el nombre de archivo, si cambian las categorías.
2. **`appsscript.json`** (ambos módulos):
   - `timeZone` → zona horaria de la institución.
   - En Consulta: `dependencies.libraries` → apunta a una librería específica (`gestionCreditosDEI`, `libraryId` fijo). **Esto es el punto más bloqueante**: sin acceso a esa librería (o sin reimplementar su lógica de búsqueda), el sistema de Consulta no funciona. Hay que decidir si se reutiliza la librería (requiere que el dueño dé acceso) o se reimplementa `buscarCreditos`/`buscarCreditosPorApellido` directamente sobre Sheets.
3. **`.clasp.json`** (Consulta): `scriptId` — se regenera automáticamente al hacer `clasp create` en el nuevo proyecto; no se debe reutilizar el actual.
4. **Estructura de la hoja de cálculo**: crear la hoja `CREDITOS_ACADEMICOS` respetando el layout esperado (datos desde fila 5, columnas A-M según el README de Carga) — o adaptar los índices de columna hardcodeados en el código si se usa otro layout.
5. **index.html / ConfigJS.html**: URLs de imágenes de cabecera, textos institucionales (nombre de universidad, contacto DEI), y el `LIMITES_CATEGORIA` duplicado en el HTML de Carga.
6. **Permisos y despliegue**:
   - Autorizar el script con una cuenta que tenga acceso de editor a la hoja y a la carpeta de Drive.
   - Reconfigurar el deployment como Web App (`executeAs`, `access`) según la política de la nueva institución (hoy: `ANYONE_ANONYMOUS`, revisar si corresponde).
7. **Vínculo entre módulos**: en Carga, la Web App de Consulta no está enlazada directamente en código, pero el README la referencia por URL fija — actualizar cualquier link cruzado entre ambos sistemas (ej. botón "ver detalles" que apunta a la carpeta de Drive del alumno, y cualquier URL de Sites institucional).

## 5. Estimación de tiempos de implementación

Para un desarrollador que ya conoce Apps Script, trabajando de forma incremental:

| Tarea | Estimación |
|---|---|
| Reconfiguración básica para instanciar en un nuevo entorno (constantes, hoja, carpeta, appsscript.json) — **sin reimplementar la librería `gestionCreditosDEI`** | 0.5 – 1 día |
| Reimplementar `gestionCreditosDEI` como funciones propias (si no se tiene acceso a la librería original) | 1 – 2 días |
| Agregar `LockService` + manejo de errores robusto en `procesarDatos` | 0.5 día |
| Migrar Consulta a runtime V8 y limpiar código legado ES5 | 0.5 – 1 día |
| Unificar límites de categoría (config centralizada vía `PropertiesService` + endpoint) | 1 día |
| Restringir exposición de datos (`getAllStudents`, autenticación/dominio en Consulta) | 1 – 2 días (depende de si se requiere OAuth/domain restriction) |
| Refactors menores (extraer utilidades, constantes de columnas, limpiar duplicación) | 1 día |
| Tests básicos (extraer lógica pura + Jest) | 1 – 2 días |
| Pruebas manuales end-to-end + ajuste de UI/UX | 1 día |
| **Total estimado (instanciación completa + mejoras prioritarias)** | **≈ 7 – 11 días hábiles** de una persona |
| **Solo instanciación mínima para uso funcional** (sin mejoras de seguridad/calidad) | **≈ 1 – 3 días hábiles**, si se tiene acceso a la librería `gestionCreditosDEI` o se reimplementa rápido |

> El mayor cuello de botella para instanciar el proyecto en un entorno nuevo es la **dependencia de la librería externa `gestionCreditosDEI`**: sin su código fuente o acceso de colaborador a ese Apps Script, hay que reconstruir desde cero la lógica de búsqueda de alumnos por matrícula/apellido, lo cual es la pieza central de ambos módulos.

## 6. Detalle de la librería externa `gestionCreditosDEI`

No está en el repositorio — es un proyecto Apps Script aparte, referenciado solo por ID en `appsscript.json` de Consulta:

```
userSymbol: gestionCreditosDEI
libraryId: 12FzHgDmE4-KhoV33scQ5qhwNLr9-81JBRyA6icC-K3vCtu1gT_NJIOep
version: 0
developmentMode: true
```

En Carga no está declarada como dependencia formal (su `appsscript.json` tiene `dependencies: {}` vacío), pero el código la referencia de forma defensiva (`typeof gestionCreditosDEI !== 'undefined'`).

**Funciones que se consumen de ella:**

- `gestionCreditosDEI.buscarCreditos(matricula)` — usada en `Consulta/codigo.js` (delega el 100% de la lógica) y en `Carga/Código.js` dentro de `buscarInfoAlumno(matricula)` como intento primario, con fallback a búsqueda local en la hoja si falla.
- `gestionCreditosDEI.buscarCreditosPorApellido(apellido)` — usada solo en `Consulta/codigo.js`, también delegando el 100% de la lógica.

**No se conoce su implementación interna** (qué columnas asume, cómo calcula el progreso de créditos, si asume el total fijo de 20). Para obtener acceso hay dos vías: que el dueño actual (`omar.irrazabal@uc.edu.py`) dé acceso de colaborador al Apps Script de la librería (buscándolo por su `libraryId` en script.google.com), o reimplementar ambas funciones desde cero contra la hoja `CREDITOS_ACADEMICOS`.

## 7. Aclaración sobre `getAllStudents()`

Es una función **local** de `Gestion-de-creditos-academicos-Carga-main/Código.js` (no forma parte de la librería externa). Lee todas las filas de la hoja `CREDITOS_ACADEMICOS` desde la fila 5, columnas A-M, y devuelve un array con `{nombre, matricula, carrera, folderUrl}` de **todos** los alumnos. Se usa desde `index.html` (`initAutocomplete()`) para poblar el autocompletado de matrícula en el formulario de Carga.

Esto confirma el riesgo ya listado en la sección 2 (Críticos): expone la base completa de alumnos, incluyendo links privados de Drive, a cualquiera que abra el modal de Carga.

## 8. Consideraciones para instanciar el sistema en otras carreras (no solo otra institución)

Si el objetivo no es solo mover el sistema a otro Workspace sino ofrecerlo a **varias carreras con estructuras de créditos distintas**, hay preguntas de diseño que resolver antes de tocar código:

**Modelo de créditos**
- ¿El total requerido es siempre 20, o varía por carrera?
- ¿Las categorías (A-F, SI, AP) y sus límites son iguales para todas las carreras, o cada una define las suyas?
- ¿Hay categorías obligatorias equivalentes a SI/Pasantías que cambien según la carrera?
- ¿Los requisitos pueden cambiar por cohorte/plan de estudios, no solo por carrera?

**Estructura de datos**
- ¿Una hoja de Sheets compartida con columna "Carrera" que filtra reglas, o una hoja separada por carrera?
- ¿Un solo deployment multi-carrera, o un deployment independiente por carrera?
- Las columnas están mapeadas por posición fija (B=matrícula, M=carpeta, etc.) — ¿todas las carreras usarían el mismo layout, o hace falta un mapeo configurable?

**Drive y gobernanza**
- ¿Carpeta padre de Drive única compartida entre carreras, o una por carrera?
- ¿Quién mantiene actualizados los límites cuando cambia un plan de estudios?
- ¿Los administrativos de una carrera deben ver solo la suya, o todos ven todo?
- ¿`gestionCreditosDEI` seguiría siendo compartida entre carreras, o necesita adaptarse si cambia el esquema de columnas?

**Recomendación clave**: sacar `LIMITES_CATEGORIA` y el total de créditos (hoy fijo en 20) de las constantes en código y convertirlos en una tabla de configuración por carrera (Sheets o `PropertiesService`), leída dinámicamente según la columna "Carrera" — así agregar una carrera nueva no implica tocar código. Esto es una extensión del ítem de la sección 3 ("Mover configuración a `PropertiesService`"), llevado a nivel multi-carrera.

## 9. Proceso de despliegue (paso a paso, vía `clasp`)

Ambos módulos se despliegan de forma independiente como Web Apps, usando la CLI `clasp`.

**Requisitos previos**: `npm install -g @google/clasp` y `clasp login` con una cuenta que tenga acceso de editor a la Hoja y a la carpeta de Drive destino.

**Carga**:
1. `clasp clone <scriptId>` (proyecto existente) o `clasp create --type standalone` (instancia nueva — genera `scriptId` propio, no reutilizar el actual si es para otra institución).
2. Configurar `NOMBRE_HOJA`, `PARENT_FOLDER_ID`, `LIMITES_CATEGORIA` antes de subir.
3. `clasp push`.
4. Vincular con la hoja de Sheets (bound o standalone según el caso).
5. Desplegar como Web App (`clasp deploy` o desde el editor `Implementar > Nueva implementación`), revisando `executeAs`/`access` (hoy: `USER_DEPLOYING` / `ANYONE_ANONYMOUS`).
6. Autorizar permisos la primera vez que se ejecuta (Sheets, Drive, HtmlService).

**Consulta**:
1. Mismo flujo `clasp clone`/`clasp create` + `clasp push`.
2. Resolver la dependencia de `gestionCreditosDEI` (ver sección 6) antes de desplegar — es el paso más delicado.
3. Configurar `ConfigJS.html` (URLs institucionales, contacto) si cambia la institución.
4. Desplegar como Web App con la misma revisión de `executeAs`/`access`.
5. Publicar la URL `/exec` en el canal correspondiente (hoy enlazada desde un Google Site institucional).

**Validación post-despliegue**: probar el flujo completo (carga de alumno de prueba → carpeta en Drive → fila en Sheets → consulta desde el otro módulo), confirmar que `NOMBRE_HOJA` coincide exactamente entre ambos módulos, y validar el layout de columnas esperado.

## 10. Despliegue desde una cuenta distinta a la de mantenimiento final

Escenario: una persona hace el despliegue inicial desde su propia cuenta, pero el sistema lo va a operar/mantener otra cuenta (institucional). Hay dos enfoques, no excluyentes:

**A. Transferir lo ya desplegado** (más frágil, deja rastros de la cuenta original):
- **Sheet**: `Compartir > engranaje > Transferir propiedad`.
- **Carpeta de Drive** (`PARENT_FOLDER_ID`): mismo mecanismo, incluyendo subcarpetas de alumnos ya creadas.
- **Proyecto Apps Script**: si es *container-bound* a la Hoja, se mueve junto con ella al transferir propiedad; si es standalone, la cuenta destino debe hacer `Archivo > Hacer una copia` tras recibir acceso de Editor.
- Ojo: si el Web App se publicó con `executeAs: USER_DEPLOYING` desde la cuenta original, el script sigue corriendo con los permisos de esa cuenta aunque se transfiera la propiedad de los recursos — lo prolijo es que la cuenta final sea quien haga el `Implementar` definitivo.

**B. Preparar el código para que sea "plug and play" en la cuenta final (recomendado)**:
- Sacar todos los IDs hardcodeados (`PARENT_FOLDER_ID`, `NOMBRE_HOJA`, límites) a `PropertiesService.getScriptProperties()`, configurables sin tocar código.
- Usar una carpeta en un **Shared Drive** institucional en vez del Drive personal de quien despliega — evita que la propiedad de las subcarpetas de alumnos quede ligada a una persona.
- Documentar un checklist de despliegue (`clasp login`, `clasp create`/`push`, configurar Script Properties, `clasp deploy`) para que la cuenta final lo ejecute ella misma.
- Resolver de antemano el acceso a `gestionCreditosDEI` para la cuenta final (colaborador de la librería, o reimplementación propia).
- Una vez migrado, sacar a la cuenta original de los permisos de Sheet/carpeta/script si no va a dar mantenimiento.

**Recomendación**: si la cuenta final ya se conoce, el camino B es más robusto — evita quedar como punto único de fallo y no requiere transferencias de propiedad complicadas entre cuentas personales/institucionales.
