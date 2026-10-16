# Instancias

Cada carpeta (`DEI/`, `DAS/`, `DIS/`, `DA/`) es **una instancia independiente** del sistema: tiene su propia Sheet, su carpeta de Drive y dos proyectos Apps Script (Carga y Consulta). El código es el mismo para todas (`src/`). Lo único que cambia es el `config.json` de cada carpeta.

```
instancias/<DIR>/
  config.json            ← el ÚNICO archivo que se edita para configurar la dirección
  .clasp-carga.json      ← {"scriptId": "..."} del proyecto Carga   (no se versiona)
  .clasp-consulta.json   ← {"scriptId": "..."} del proyecto Consulta (no se versiona)
```

Para una dirección nueva: se copia `_ejemplo/config.json` y se reemplaza cada texto `COMPLETAR…`. El build (`node tools/build.js <DIR>`) se niega a generar mientras quede alguno sin completar o mientras `esquema.revisado` no sea `true`.

## Referencia de `config.json`

| Clave | Qué es |
|---|---|
| `direccion.sigla` | Sigla visible (títulos, PDF, mensajes). Ej.: `DAS` |
| `direccion.nombre`, `universidad` | Textos institucionales |
| `direccion.emailContacto` | Contacto que se muestra en el footer de Consulta |
| `direccion.desarrollador` | `{nombre, email}`; dejar `nombre` vacío para ocultarlo |
| `direccion.urlSitio` | Botón "Volver al Inicio" de Consulta (vacío lo oculta) |
| `direccion.imagenCabecera`, `favicon`, `lema` | Cabecera visual (`lema` vacío lo oculta) |
| `direccion.carreraPorDefecto` | Texto que se muestra si la celda Carrera está vacía |
| `tema.colorPrimario`, `colorPrimarioHover` | Colores en hex (`#RRGGBB`) |
| `infra.spreadsheetId` | ID de la Sheet. `""` = usar la hoja a la que está vinculado el script. **Consulta necesita el ID si es un proyecto standalone** |
| `infra.nombreHoja` | Pestaña de datos (por defecto `CREDITOS_ACADEMICOS`) |
| `infra.nombreHojaAuditoria` | Pestaña de auditoría; se crea sola en la primera carga |
| `infra.parentFolderId` | Carpeta de Drive donde se crean las carpetas de alumnos (idealmente en un Shared Drive) |
| `infra.timeZone` | Zona horaria del proyecto Apps Script |
| `hoja.filaInicioDatos` | Primera fila con alumnos (5 en la plantilla) |
| `webapp.cargaAccess` / `consultaAccess` | `MYSELF`, `DOMAIN`, `ANYONE`, `ANYONE_ANONYMOUS` |
| `consulta.resultadosPorPagina`, `minLongitudApellido` | Parámetros de búsqueda |
| `consulta.maxBusquedasPorMinuto` | Límite global anti-scraping (0 lo desactiva) |
| `esquema.revisado` | Hay que ponerlo en `true` después de confirmar límites, mínimos y total con el reglamento de la dirección |
| `esquema.totalRequerido` | Créditos necesarios para egresar |
| `esquema.pasoCreditos` | Incremento permitido (0.5) |
| `esquema.categorias.<A-F>` | Una entrada por categoría que use la dirección. Las letras son **columnas fijas de la hoja** (A→F, B→G, C→H, D→I, E→J, F→K); si la dirección usa menos categorías, se borran las que sobran |
| `…limite` | Máximo computable en la categoría |
| `…minimo` *(opcional)* | Mínimo obligatorio; se muestra en Consulta |
| `…obligatoria` *(opcional)* | Marca "(Obligatorio)" en el encabezado si no hay mínimo |
| `…codigoArchivo` | Prefijo en el nombre del PDF subido (único por categoría) |
| `…nombre`, `nombreCorto`, `icono`, `descripcion` | Textos de UI |
| `…detalles` | Secciones `{titulo, items[]}` de "Ver más detalles". Los `items` admiten HTML simple (`<strong>`) |
| `esquema.especiales.SI` / `AP` | Categorías sin créditos. `habilitada: false` las quita del formulario y de Consulta |
| `faq` | Preguntas frecuentes de Consulta (`respuestaHtml` admite HTML simple) |

> Los campos que admiten HTML (`items`, `respuestaHtml`) se insertan tal cual en la página: solo deben editarlos administradores.
