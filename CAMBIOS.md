# Registro de cambios: refactor v2 (plantilla multi-instancia)

Este archivo documenta **qué se cambió, por qué y qué impacto tendría** respecto del código original del DEI (que se conserva sin tocar en `legacy/`).

**Columna "Impacto si se lleva al DEI"**, para cuando se decida migrar la producción del DEI a esta plantilla:
- **Idéntico**: mismo comportamiento visible.
- **UI**: cambia algo visible para el usuario.
- **Hoja**: cambia lo que se escribe en la Sheet.
- **Contrato**: cambia la comunicación cliente↔servidor (por eso servidor y cliente se despliegan juntos).
- **Despliegue**: cambia la configuración del proyecto Apps Script.

---

## 0. Estructura: antes → después

| Antes | Después | Por qué |
|---|---|---|
| `Gestion-de-creditos-academicos-Carga-main/` | `legacy/…Carga-main/` (sin cambios) + `src/carga/` | Conservar el original como referencia del DEI en producción |
| `Gestion-de-creditos-academicos-Consulta-main/` | `legacy/…Consulta-main/` (sin cambios) + `src/consulta/` | Ídem |
| `Biblioteca - Créditos DEI.js` (librería externa) | `legacy/Biblioteca - Créditos DEI.js` + lógica absorbida en `src/consulta/Datos.gs` | Dejar cada instancia autocontenida |
| Constantes dispersas en `.js` y `.html` | `instancias/<DIR>/config.json` (un archivo por dirección) | Un solo lugar para todo lo que cambia entre direcciones |
| Copiar archivos a mano a Apps Script | `node tools/build.js <DIR>` → `dist/<DIR>/carga` y `dist/<DIR>/consulta` | Generar cada instancia de forma reproducible |
| Sin tests | `npm test` (Node, sin dependencias) | Probar reglas de negocio sin desplegar |
| — | `src/compartido/` (Esquema, Util, Reglas, Instancia) | Código común: el build lo copia a ambos módulos |

---

## 1. Configuración centralizada

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 1.1 | Todo valor específico de una dirección pasa a `instancias/<DIR>/config.json`: IDs (hoja, carpeta), nombre de hoja, zona horaria, textos institucionales, imagen, colores, categorías (nombre, límite, mínimo, código de archivo, descripciones), FAQ, acceso de las Web Apps | Clonar a DAS, DIS y DA sin buscar valores en el código. Antes estaban en `Código.js`, `index.html`, `JavaScript.html`, `Page.html`, `ConfigJS.html` y los dos `appsscript.json` | `instancias/*/config.json`, `tools/build.js` | Idéntico (`instancias/DEI/config.json` tiene los valores actuales) |
| 1.2 | El build genera `Config.gs` (`const CONFIG`) y ajusta `appsscript.json` (`timeZone`, `webapp.access`) | Apps Script no puede leer `.env`: la config tiene que viajar como código. El `.env`/`.env.example` original no lo leía nadie | `tools/build.js` | Despliegue |
| 1.3 | El build valida la config: campos obligatorios, límites > 0, mínimo ≤ límite, códigos de archivo únicos, textos `COMPLETAR…` sin reemplazar, `esquema.revisado: true` | Que una instancia no salga a producción con datos de ejemplo o con los límites del DEI copiados sin revisar | `tools/validar-config.js` | — |
| 1.4 | `LIMITES_CATEGORIA` ya no está duplicado: había **tres** copias (servidor de Carga, `index.html` y valores sueltos en `JavaScript.html` de Consulta). Ahora el navegador recibe `configPublica()` (sin IDs) desde el servidor | Si se cambiaba un límite en un lugar y no en otro, la UI y el servidor divergían. Con esquemas distintos por dirección era el bloqueante principal | `src/compartido/Instancia.gs`, `index.html`, `Page.html`, `JavaScript.html` | Idéntico |
| 1.5 | Colores del tema por instancia (`tema.colorPrimario`) inyectados como override de las variables CSS | Que cada dirección use su color sin tocar los `.html` de estilos | `Instancia.gs#estilosTema` | Idéntico |
| 1.6 | Las tarjetas de categorías y las FAQ de `Page.html` se generan desde la config. "Máximo N créditos" y "Mínimo N créditos" se calculan a partir de `limite`/`minimo` | Antes eran HTML fijo con los números del DEI escritos a mano | `src/consulta/Page.html` | Idéntico (mismo contenido) |
| 1.7 | `infra.spreadsheetId`: si tiene valor, la hoja se abre con `openById`; si está vacío, se usa la hoja contenedora | La librería usaba `getActiveSpreadsheet()`, que solo funciona si el script está vinculado a la hoja | `Instancia.gs#obtenerLibro` | Idéntico (DEI con `""`) |

## 2. Eliminación de la librería externa `gestionCreditosDEI`

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 2.1 | `buscarCreditos` y `buscarCreditosPorApellido` se reimplementan dentro de Consulta y se quita la dependencia de `appsscript.json` | La librería estaba en `developmentMode: true` (HEAD en vivo: cualquier "Guardar" en ese proyecto afectaba a producción al instante) y requería acceso del dueño | `src/consulta/Datos.gs`, `src/consulta/appsscript.json` | Despliegue |
| 2.2 | En Carga se borra la rama "usar librería si existe" de `buscarInfoAlumno` | Era inalcanzable: Carga no declaraba la librería (`dependencies: {}`), así que siempre corría el fallback local | `src/carga/Datos.gs` | Idéntico |
| 2.3 | La búsqueda por apellido normaliza con `normalize('NFD')` en vez de la tabla manual de acentos | Mismo resultado, cubre todos los diacríticos y es más corto | `Util.gs#normalizarTexto` | Idéntico |

## 3. Código muerto eliminado

| # | Qué | Por qué | Impacto si se lleva al DEI |
|---|---|---|---|
| 3.1 | `actualizarCreditos` (librería) | No la usaba nadie y estaba mal: C y E escribían en la misma columna (H), D iba a J en vez de I y sumaba el Total a mano | Idéntico |
| 3.2 | `linkURL`, `onChange`, `doGet`/`include` de la librería | No se usaban desde ningún módulo | Idéntico |
| 3.3 | Primer `doGet` duplicado en `Consulta/codigo.js` | La segunda definición lo pisaba en silencio. Se conserva el comportamiento de la que ganaba (título "Consulta de Créditos …") | Idéntico |
| 3.4 | `BASE_COLUMNA_CREDITOS`, `COLUMNA_A_INDEX` (cálculo con código ASCII) | Se reemplazan por `COLUMNAS` con nombre | Idéntico |

## 4. Esquema de columnas con nombre

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 4.1 | `COLUMNAS = { NOMBRE:1, MATRICULA:2, CARRERA:3, TOTAL:4, SI:5, CAT_A:6 … CAT_F:11, ENLACE:13 }` | Sacar los números mágicos (5, 13, 15, `lastRow - 4`…) | `src/compartido/Esquema.gs` | Idéntico |
| 4.2 | **Corrección de nombres**: H = Ayudantías (C), **I = Extensión (D)**, **J = Pasantías (E)**. Los campos de la librería (`AyudantiasPasantias`, `Investigacion`, `Extension`) estaban corridos; la UI lo compensaba por posición | Evitar que alguien "arregle" el mapeo y rompa los datos | `Esquema.gs` | Idéntico (mismas columnas) |
| 4.3 | Se agrega `hoja.filaInicioDatos` en la config (5 en el DEI) | Era el número mágico más repetido | `config.json` | Idéntico |

## 5. Capas y reglas de negocio

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 5.1 | Separación por capas: `Reglas.gs` (puro, testeable), `Datos.gs` (hoja), `Drive.gs` (carpetas/archivos), `Auditoria.gs`, `Main.gs` (orquestación) | `procesarDatos` hacía todo en 180 líneas | `src/carga/*`, `src/compartido/Reglas.gs` | Idéntico |
| 5.2 | Se documenta el "por qué" de SI/AP (no suman créditos) y del recorte al límite | Reglas no obvias para quien mantenga | `Reglas.gs` (encabezado) | — |
| 5.3 | `resumenAlumno` calcula en el servidor el total, lo que falta, el estado de SI y los mínimos pendientes | Las reglas viven en un solo lugar; antes el navegador repetía `>= 20` y la lógica de SI de 3 maneras distintas | `Reglas.gs`, `JavaScript.html` | Idéntico |
| 5.4 | **Nuevo**: soporte de `minimo` por categoría (E = 7 en el DEI). Consulta muestra "(Mínimo: 7)" en el encabezado y "Faltan N para el mínimo" en la celda | `Page.html` ya anunciaba la regla, pero ningún módulo la mostraba ni la validaba | `Reglas.gs`, `JavaScript.html` | **UI** |
| 5.5 | Interpretación unificada de la celda SI (`Aprobado`, `sí`, `si`, `yes`, `true`, `1`). Antes la vista simplificada usaba `includes('si')` y la completa usaba igualdad | Que las dos vistas no puedan mostrar resultados distintos | `Reglas.gs#siEstaAprobado` | Idéntico en la práctica (la hoja usa "Aprobado") |
| 5.6 | Si la celda Total (D) está vacía, se usa la suma de A–F | Instancias nuevas cuya hoja todavía no tiene la fórmula | `Reglas.gs#resumenAlumno` | Idéntico |
| 5.7 | El servidor valida que los créditos sean múltiplos de `pasoCreditos` (0.5) | Solo lo validaba el navegador, y sin bloquear el envío | `Reglas.gs#validarCreditosSolicitados` | **UI** (rechaza 1.3) |
| 5.8 | Superar el límite ya no marca el campo como inválido en el navegador: el servidor recorta y avisa, como antes | Ahora el formulario sí respeta `checkValidity()`, y si no se cambiaba esto, se habría bloqueado un caso que antes se permitía | `index.html` | Idéntico |

## 6. Robustez de escritura

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 6.1 | `LockService` alrededor de leer-calcular-escribir en `procesarDatos` | Dos cargas simultáneas al mismo alumno podían pisarse | `Main.gs#conBloqueo` | Idéntico (más seguro) |
| 6.2 | Orden nuevo: primero se valida el límite, después se sube el archivo y recién al final se escribe la hoja | Antes, si Drive fallaba, los créditos ya estaban sumados sin certificado | `Main.gs#aplicarCarga` | Idéntico en el caso feliz |
| 6.3 | La auditoría pasa a una hoja `AUDITORIA` (append-only: fecha, usuario, matrícula, categoría, solicitados, asignados, límite, archivo, observación) | Antes se escribía en `getLastColumn()+1`: **cada carga agregaba una columna nueva** a la hoja de créditos | `src/carga/Auditoria.gs` | **Hoja**: se crea la hoja AUDITORIA; las columnas viejas (N, O, …) quedan como histórico y no se borran |
| 6.4 | Si falla la auditoría, el usuario lo ve como advertencia (antes solo había un `console.warn`) | No dejar estados inconsistentes en silencio | `Main.gs` | UI |
| 6.5 | Si la carpeta padre de Drive no es accesible, la carga falla con un mensaje claro | Antes se creaba la carpeta del alumno en la raíz del Drive de quien desplegó, fuera de la carpeta compartida | `Drive.gs` | **UI** (error en vez de una carpeta perdida) |

## 7. Contrato de errores unificado

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 7.1 | Todos los endpoints devuelven `{ ok, data, error }` | Convivían excepciones (Carga) y `{error:true, mensaje}` (Consulta) | `Util.gs#respuestaOk/respuestaError`, todos los `Main/Datos` | **Contrato** |
| 7.2 | Las dos búsquedas de Consulta devuelven siempre un array (vacío si no hay resultados) | Antes el "no encontrado" llegaba como objeto de error y la UI lo detectaba porque faltaban campos | `src/consulta/Datos.gs` | Contrato |
| 7.3 | Payload de Consulta en camelCase y alineado al esquema: `nombre, matricula, carrera, enlace, total, faltan, totalCompleto, siAprobado, categorias:{A…F}, minimosPendientes` | Los nombres anteriores (`AprobacionSI`, `MateriasCursos`, `Investigacion`…) eran inconsistentes y estaban corridos | `Reglas.gs#resumenAlumno` | Contrato |

## 8. Seguridad

| # | Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|---|
| 8.1 | `getAllStudents()` devuelve solo `{matricula, nombre, carrera}` (sin `folderUrl`) | Exponía los enlaces de Drive de todos los alumnos | `src/carga/Datos.gs` | Contrato |
| 8.2 | `procesarDatos` resuelve la carpeta desde la hoja e ignora cualquier `folderUrl` que mande el navegador | Un cliente podía elegir en qué carpeta se subía el archivo | `Main.gs`, `Drive.gs`, `index.html` | Contrato |
| 8.3 | Web App de Carga con acceso `DOMAIN` por defecto (`webapp.cargaAccess`) | Estaba `ANYONE_ANONYMOUS` + `USER_DEPLOYING`: cualquiera con la URL podía escribir créditos | `config.json`, `tools/build.js` | **Despliegue** |
| 8.4 | `escaparHTML` real en Carga y Consulta, en reemplazo de `limpiarHTML` | `limpiarHTML` asignaba `innerHTML` (un `<img onerror>` se ejecuta) y reinyectaba el texto. Además, `carrera` y el autocompletado de Carga no se sanitizaban | `Util.gs`, `index.html`, `JavaScript.html` | Idéntico |
| 8.5 | Los enlaces "Ver detalles" solo aceptan `http(s)` y llevan `rel="noopener"` | Un enlace `javascript:` en la hoja se ejecutaba | `JavaScript.html#urlSegura` | Idéntico |
| 8.6 | Se quitan los `onclick` inline (PDF, paginación, vistas, detalles) y se usan `addEventListener` + delegación | El nombre del alumno se metía en `onclick="exportarAPDF('…')"`: un apóstrofo (O'Brien) rompía el botón | `Page.html`, `JavaScript.html` | Idéntico |
| 8.7 | Rate limit global de búsquedas por minuto en Consulta (`consulta.maxBusquedasPorMinuto`, 0 lo desactiva) | Con acceso anónimo no hay otra forma de frenar el scraping de matrículas | `src/consulta/Datos.gs#controlarFrecuencia` | UI (solo ante abuso) |

## 9. Convenciones y calidad

| # | Qué | Por qué | Impacto si se lleva al DEI |
|---|---|---|---|
| 9.1 | Consulta pasa de `DEPRECATED_ES5` a **V8** | Google lo está retirando | Despliegue |
| 9.2 | Todo con `const`/`let`, arrow functions y template literals; archivos `.gs` con nombre por capa (antes `Código.js` vs `codigo.js`) | Consistencia entre módulos | Idéntico |
| 9.3 | Generación de HTML con template literals en vez de concatenación | Legibilidad | Idéntico |
| 9.4 | `extraerFolderId` (estaba 3 veces) y `normalizarMatricula` (5 veces) en `Util.gs` | Duplicación | Idéntico |
| 9.5 | `numeroEnPalabras` (antes `numberToWordsES`) soporta decimales ("2.5 (dos coma cinco)") y corrige 101–199 ("ciento uno"; antes daba "cien uno") | Antes 2.5 quedaba como "dos" en el nombre del archivo | **Nombres de archivo** con decimales |
| 9.6 | La matrícula se compara también sin espacios alrededor (`trim`) | Celdas con espacios de más no se encontraban | Idéntico o mejor |
| 9.7 | Arreglados: los mensajes rotativos del loader de Consulta (la variable había quedado dentro de un comentario y nunca se mostraban); el botón que se rehabilita en Carga (antes el primer `button`, ahora `#btnSubmit`); `buscarCreditos` ya no revienta con la hoja vacía | Bugs menores | UI |
| 9.8 | El historial de búsquedas tolera un `localStorage` bloqueado | En modo privado podía romper la página | Idéntico |

## 10. Cambios de texto visibles (respecto del DEI actual)

- En el `<select>` de Carga, la categoría A aparece como "A - Cursos" (`nombreCorto`). Si se prefiere "Cursos Optativos", se cambia `nombreCorto` en la config.
- En el footer de Consulta, el desarrollador aparece como "Omar Irrazabal", sin "OI- setiembre 2025".
- En el pie del PDF dice "Universidad … - DEI", sin "- By OI".
- El mensaje de "no encontrado" ahora menciona matrícula **o** apellido.

## Pendiente / fuera de este refactor

- Restringir Consulta al dominio `uc.edu.py`: es una decisión institucional (`webapp.consultaAccess`).
- Verificar en la hoja real del DEI que D sea una fórmula y que L esté libre, antes de migrar.
- Completar `instancias/DAS|DIS|DA/config.json` con los datos y el reglamento de cada dirección.

## Instancia STG (staging personal)

`instancias/STG/config.json` es una copia de la del DEI para probar el flujo completo en una cuenta propia (Sheet copia, carpeta de Drive propia, dos proyectos Apps Script). Acceso `MYSELF` en ambas Web Apps y color distinto para no confundirla con producción. Los IDs quedan como `COMPLETAR…` y el build se niega a correr hasta completarlos.

### Aprovisionamiento automático (`npm run crear -- <DIR>`)

| Qué | Por qué | Archivos | Impacto si se lleva al DEI |
|---|---|---|---|
| `tools/crear-instancia.js`: crea con `clasp` la Sheet + proyecto de Carga, el proyecto de Consulta, guarda los IDs, hace push y despliega Consulta | Levantar staging o una dirección nueva con un solo comando | `tools/crear-instancia.js` | Idéntico (herramienta de desarrollo) |
| Menú «Inicializar entorno»: crea la pestaña de datos con 3 alumnos de prueba, AUDITORIA y la carpeta de Drive (su ID queda en Script Properties) | Apps Script no puede crear carpetas desde fuera sin un proyecto de Google Cloud | `src/carga/Inicializar.gs`, `Main.gs` | Hoja/UI: ítem nuevo en el menú; no toca hojas existentes |
| `infra.parentFolderId` puede quedar vacío; Carga usa entonces la carpeta de Script Properties | Para que el ID no haga falta antes de crear la carpeta | `Drive.gs`, `validar-config.js` | Idéntico si el DEI mantiene su ID |
