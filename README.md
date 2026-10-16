# Sistema de Créditos Académicos (plantilla multi-instancia)

Dos módulos de Google Apps Script que comparten una Google Sheet:

- **Carga**: formulario (modal desde la hoja) donde el administrativo asigna créditos por categoría y sube el certificado a la carpeta de Drive del alumno.
- **Consulta**: página web donde el alumno busca por matrícula o apellido y ve su progreso.

El mismo código sirve para varias direcciones. **Cada dirección es una instancia separada** (con su hoja, su Drive y sus proyectos Apps Script), configurada por un único archivo: `instancias/<DIR>/config.json`.

```
src/compartido/   Esquema, utilidades, reglas de negocio y acceso a la config (se copian a ambos módulos)
src/carga/        Módulo Carga
src/consulta/     Módulo Consulta
instancias/       Un config.json por dirección (DEI, DAS, DIS, DA) + _ejemplo
tools/build.js    Genera dist/<DIR>/carga y dist/<DIR>/consulta, y hace clasp push
tests/            npm test (Node, sin dependencias)
legacy/           Código original del DEI, sin modificar (referencia)
```

```bash
npm test
node tools/build.js DEI                 # genera dist/DEI/
node tools/build.js DAS --push todo     # genera y sube (requiere clasp y .clasp-*.json)
```

- **Configurar una dirección**: `instancias/README.md`
- **Desplegar o actualizar**: `DESPLIEGUE.md`
- **Qué cambió respecto del original y por qué**: `CAMBIOS.md`
- **Estructura de la hoja**: `plantilla-hoja/estructura.md`
- **Análisis original**: `ANALISIS_PROYECTO.md`
