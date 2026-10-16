# Guía de pruebas en una instancia de staging propia

Sirve para probar el sistema completo (Carga + Consulta) en **tu propia cuenta de Google**, sin tocar la producción del DEI. Cada persona que prueba crea su propia instancia: la Sheet, la carpeta de Drive y los dos proyectos Apps Script quedan a su nombre.

> Apps Script no corre en la PC: `SpreadsheetApp`, `DriveApp` y `google.script.run` solo existen en los servidores de Google. Por eso el "entorno local" es una copia completa en tu cuenta, que se crea con un solo comando.

## 1. Requisitos (una vez por máquina)

- Node.js 18 o superior (`node -v`).
- Una cuenta de Google. Con una personal alcanza; con la institucional, el administrador del dominio puede limitar los permisos.
- `clasp`:
  ```bash
  npm i -g @google/clasp
  clasp login
  ```
- Activar la **Google Apps Script API** en https://script.google.com/home/usersettings. Sin esto `clasp create` falla con un error de permisos.

## 2. Crear la instancia

Desde la raíz del repo:

```bash
npm test                  # 21 pruebas de reglas de negocio; deben pasar todas
npm run crear -- STG
```

El comando hace esto, en orden:
1. Crea una Sheet nueva y el proyecto Apps Script de **Carga** vinculado a ella.
2. Crea el proyecto Apps Script de **Consulta**.
3. Guarda los IDs en `instancias/STG/.clasp-carga.json`, `.clasp-consulta.json` y en `infra.spreadsheetId` de `config.json`.
4. Hace build y push de ambos módulos.
5. Despliega Consulta.
6. Imprime la URL de la Sheet y la URL `/exec` de Consulta.

Es seguro repetirlo: si los `.clasp-*.json` ya existen, los reutiliza.

## 3. Inicializar el entorno (un solo clic, obligatorio)

Apps Script no puede crear carpetas de Drive ni el contenido de la hoja desde fuera. Lo hace el propio script de Carga, con tu consentimiento:

1. Abre la Sheet (URL impresa por el comando) y **recarga la página**.
2. Menú **Gestión de Créditos → Inicializar entorno (solo primera vez)**.
3. Autoriza los permisos. Google avisa "aplicación no verificada": `Configuración avanzada → Ir a … (no seguro)`. Es tu propio script.

Crea:
- La pestaña `CREDITOS_ACADEMICOS` con 3 alumnos de prueba.
- La pestaña `AUDITORIA`.
- Una carpeta `Créditos STG - alumnos` en tu Drive. Su ID queda guardado en las Script Properties del proyecto.

Alumnos de prueba:

| Matrícula | Nombre | Para probar |
|---|---|---|
| `1000001` | Pérez, Juan | Caso normal |
| `1000002` | O'Brien, María | Apóstrofo en el nombre (antes rompía el botón de PDF) |
| `0000003` | Gómez Álvarez, Ana | Ceros a la izquierda y tildes |

Es idempotente: ejecutarlo de nuevo no toca una hoja que ya existe.

## 4. Probar

- **Carga**: Sheet → menú **Gestión de Créditos → Abrir Formulario de Carga**.
- **Consulta**: URL `/exec` impresa por el comando. La Web App tiene acceso `MYSELF`, así que solo la abre tu cuenta.

### Checklist de Carga
- [ ] Categoría A con 2 créditos: la celda F suma 2 y el PDF queda como `2 (dos) C-<mat>.pdf` en la carpeta del alumno.
- [ ] Alumno sin carpeta: se crea `MAT-Nombre` dentro de `Créditos STG - alumnos` y el enlace queda en la columna M.
- [ ] Exceso (cargar 12 créditos en A y luego 1 más): asigna lo que queda, muestra "LÍMITE ALCANZADO" y registra una fila en `AUDITORIA`.
- [ ] Categoría llena: error, sin escrituras ni archivos.
- [ ] Categoría SI: escribe "Aprobado" en E. Categoría AP: solo guarda el archivo.
- [ ] Créditos 2.5 aceptado (el archivo dice "dos coma cinco"); 1.3 rechazado.
- [ ] Matrícula con ceros (`0000003`) encontrada correctamente.
- [ ] Dos pestañas cargando al mismo alumno y categoría a la vez: la suma final es correcta.
- [ ] Un nombre de archivo o campo con `<img onerror=...>` no ejecuta nada.

### Checklist de Consulta
- [ ] Matrícula existente e inexistente (mensaje claro en ambos casos).
- [ ] Apellido con tilde (`gomez` encuentra `Gómez`).
- [ ] Más de 5 resultados: paginación (hay que agregar alumnos extra a la hoja).
- [ ] Vista simplificada y completa, en escritorio y en el móvil.
- [ ] Exportar a PDF, incluido el alumno `O'Brien`. "Ver detalles" abre la carpeta del alumno.
- [ ] Los valores por categoría coinciden con la hoja (categoría D = columna I, E = columna J).
- [ ] Pasantías por debajo del mínimo muestra "Faltan N para el mínimo".
- [ ] Más de 60 búsquedas en un minuto: bloqueo temporal (`maxBusquedasPorMinuto`).

Si algo falla, anota: qué hiciste, qué esperabas, qué pasó y captura de pantalla. En Apps Script los errores están en `Ejecuciones` (menú lateral del editor).

## 5. Iterar cuando cambie el código

```bash
node tools/build.js STG --push carga      # recargar la Sheet para verlo
node tools/build.js STG --push consulta   # ver en Implementar → Probar implementaciones (URL /dev)
```
La URL `/exec` queda en la versión desplegada. Para actualizarla: `Implementar → Gestionar implementaciones → editar → Versión nueva`. No crear una implementación nueva, porque cambiaría la URL.

## 6. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `clasp: command not found` | Falta `npm i -g @google/clasp`, o reabrir la terminal. |
| `User has not enabled the Apps Script API` | Activarla en https://script.google.com/home/usersettings y esperar unos minutos. |
| `No pude leer el ID…` al crear | `clasp` cambió el formato de su salida. Crear los proyectos a mano y escribir `{"scriptId":"…"}` en `instancias/STG/.clasp-*.json`; poner el ID de la Sheet en `infra.spreadsheetId`. Luego `node tools/build.js STG --push todo`. |
| El menú "Gestión de Créditos" no aparece | Recargar la Sheet. Si sigue sin aparecer, ejecutar `onOpen` desde el editor y autorizar. |
| "No se pudo acceder a la carpeta padre de Drive" | No se ejecutó "Inicializar entorno" o no se autorizó Drive. |
| `No hay hoja de cálculo…` en Consulta | `infra.spreadsheetId` vacío. Completarlo y volver a hacer push. |
| Consulta pide iniciar sesión | Es lo esperado con `consultaAccess: MYSELF`. Para probar como anónimo, cambiarlo a `ANYONE_ANONYMOUS` en `config.json` y actualizar la implementación. |

## 7. Limpiar al terminar

- Borrar la Sheet y la carpeta `Créditos STG - alumnos` desde Drive. Los proyectos Apps Script aparecen en https://script.google.com/home.
- Los archivos `instancias/STG/.clasp-*.json` no se suben a git (están en `.gitignore`). Se pueden borrar localmente.
- Sin esos archivos, `npm run crear -- STG` crea una instancia nueva desde cero.

## Archivos relacionados

- `DESPLIEGUE.md`: despliegue de instancias reales y regresión completa.
- `CAMBIOS.md`: qué cambió respecto del código original del DEI (`legacy/`) y su impacto.
- `instancias/README.md`: referencia de `config.json`.
