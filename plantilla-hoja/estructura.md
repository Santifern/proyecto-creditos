# Estructura de la hoja de créditos

Es igual en todas las instancias. Para una dirección nueva, conviene copiar la Sheet del DEI y borrar las filas de alumnos (así se conservan formatos y fórmulas), o armarla a mano siguiendo esta tabla.

## Pestaña `CREDITOS_ACADEMICOS`

- Filas 1–4: encabezado libre (títulos, logos). La fila 4 suele llevar los nombres de las columnas.
- Desde la **fila 5** (`hoja.filaInicioDatos`): un alumno por fila.

| Col | Contenido | Quién la escribe |
|---|---|---|
| A | Nombre completo (Apellido, Nombre) | Administrativo |
| B | Matrícula | Administrativo |
| C | Carrera | Administrativo |
| D | **Total**: fórmula, p. ej. `=SUM(F5:K5)` | Fórmula (ningún módulo la escribe) |
| E | Suficiencia en Inglés: "Aprobado" | Carga (categoría SI) |
| F | Créditos categoría A | Carga |
| G | Créditos categoría B | Carga |
| H | Créditos categoría C | Carga |
| I | Créditos categoría D | Carga |
| J | Créditos categoría E | Carga |
| K | Créditos categoría F | Carga |
| L | (libre) | — |
| M | Enlace a la carpeta de Drive del alumno | Carga (si está vacío, crea la carpeta) |

Si la dirección usa menos de 6 categorías, sus columnas igual existen y quedan vacías.

## Pestaña `AUDITORIA`

Se crea sola en la primera carga: Fecha · Usuario · Matrícula · Categoría · Solicitados · Asignados · Límite · Archivo · Observación.

## Antes de migrar el DEI

La versión anterior escribía auditoría en columnas nuevas a la derecha (N, O, P…). No hay que borrarlas: quedan como histórico. Desde la v2 ya no se crean columnas nuevas.
