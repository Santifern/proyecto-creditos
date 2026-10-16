# 🎓 Sistema de Gestión de Créditos Académicos DEI - Carga de Créditos Académicos

Proyecto desarrollado en Google Apps Script como parte del proceso de automatización de la gestión académica en el Departamento de Electrónica e Informática (DEI) de la Universidad Católica del Maule.

Este sistema constituye una solución completa para la **carga y administración** de créditos académicos, complementando el sistema de consulta existente. Está enfocado en facilitar el trabajo administrativo mediante una interfaz web intuitiva y controles automáticos de validación.

![Header DEI](https://i.imgur.com/A5gWkLy.jpg)

## 📋 Descripción

La aplicación surge como respuesta a la necesidad de contar con una herramienta que permita **cargar, validar y gestionar** de manera eficiente los créditos académicos de estudiantes de las carreras de ingeniería del DEI. El sistema automatiza procesos manuales, reduce errores y proporciona trazabilidad completa de las operaciones.

## ✨ Características principales

- 🔍 **Autocompletado inteligente**: Búsqueda de estudiantes por matrícula con sugerencias en tiempo real
- 📄 **Gestión de documentos**: Subida automática de PDFs con nomenclatura estandarizada
- 🎯 **Control de límites**: Validación automática según categoría de créditos
- 📊 **Interfaz profesional**: Diseño moderno, responsivo y optimizado para dispositivos móviles
- 📁 **Organización automática**: Creación de carpetas estudiantiles en Google Drive
- 🔄 **Progreso visual**: Indicador de carga con barra de progreso animada
- 🛡️ **Categorías especiales**: Manejo de aprobaciones SI (Suficiencia Inglés) y AP (Pasantía)
- 📝 **Auditoría completa**: Registro detallado de todas las operaciones y excesos
- ⚠️ **Validación en tiempo real**: Prevención de errores antes del procesamiento
- 🎨 **Experiencia optimizada**: Interfaz que se adapta según la selección del usuario

## � Funcionalidades

### Para Administradores Académicos
- **Carga masiva de créditos**: Procesamiento individual con validación automática
- **Control de límites**: Prevención automática de excesos por categoría
- **Gestión de archivos**: Organización automática de certificados PDF
- **Auditoría detallada**: Registro completo de operaciones y excesos
- **Categorías especiales**: Manejo de SI (Suficiencia Inglés) y AP (Aprobación Pasantía)

### Para el Sistema
- **Validación en tiempo real**: Verificación de límites antes del procesamiento
- **Creación automática de carpetas**: Organización en Google Drive por estudiante
- **Nomenclatura estandarizada**: Nombres de archivo consistentes y descriptivos
- **Interfaz adaptativa**: Diseño que responde a las acciones del usuario
- **Progreso visual**: Indicadores de carga para una mejor experiencia

## 📂 Estructura del Proyecto

```
GestionCreditoDEI/
├── Código.js           # Lógica principal del servidor (Apps Script)
├── index.html          # Interfaz web del usuario
├── styles.html         # Estilos CSS profesionales
├── appsscript.json     # Configuración del proyecto Google Apps Script
├── .clasp.json         # Configuración de sincronización (local)
├── .gitignore          # Archivos excluidos del repositorio
└── README.md           # Documentación del proyecto
```

## 🎨 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6
- **Backend**: Google Apps Script (V8 Runtime)
- **Base de datos**: Google Sheets con estructura optimizada
- **Almacenamiento**: Google Drive con organización automática
- **Arquitectura**: Cliente-servidor con validación dual
- **Diseño responsivo**: CSS Grid y Flexbox con variables personalizadas
- **Fuentes**: Segoe UI con fallbacks optimizados
- **Iconos**: Emojis Unicode para máxima compatibilidad

## 📊 Límites por Categoría

| Categoría | Descripción | Límite Máximo |
|-----------|-------------|---------------|
| **A** | Cursos Optativos | 12 créditos |
| **B** | Conferencias/Congresos/Seminarios | 4 créditos |
| **C** | Ayudantías de Cátedra | 10 créditos |
| **D** | Extensión Universitaria | 2 créditos |
| **E** | Pasantías Supervisadas (Obligatorio) | 10 créditos |
| **F** | Otros | 4 créditos |
| **SI** | Aprobación Suficiencia Inglés | No aplica |
| **AP** | Aprobación de Pasantía | No aplica |

## 🚀 Instalación y Configuración

### Prerrequisitos:
- Cuenta de Google con acceso a Google Sheets, Drive y Apps Script
- Node.js (para usar clasp - opcional)
- Acceso de editor a la hoja de cálculo de estudiantes

### Pasos de Instalación:

1. **Clonar el Repositorio**:
   ```bash
   git clone https://github.com/usuario/gestion-creditos-dei.git
   cd gestion-creditos-dei
   ```

2. **Configurar Google Apps Script**:
   - Instalar clasp: `npm install -g @google/clasp`
   - Autenticar: `clasp login`
   - Crear proyecto: `clasp create --type standalone --title "Gestión Créditos DEI"`

3. **Configurar Variables**:
   En `Código.js`, actualizar:
   ```javascript
   const NOMBRE_HOJA = "CREDITOS_ACADEMICOS";        // Nombre de tu hoja
   const PARENT_FOLDER_ID = 'tu-folder-id-aqui';     // ID carpeta padre
   ```

4. **Subir Código**:
   ```bash
   clasp push
   ```

5. **Configurar Permisos**:
   - Ejecutar `onOpen()` una vez para crear el menú
   - Autorizar permisos de Drive, Sheets y HTMLService

### Estructura de la Hoja de Cálculo:

La hoja debe tener la siguiente estructura (empezando en fila 5):

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nombre | Matrícula | Carrera | Total | SI | A | B | C | D | E | F | ... | Folder URL |

## 💡 Uso del Sistema

### Acceso:
1. **Desde Google Sheets**: Menú "Gestión de Créditos" → "Abrir Formulario de Carga"
2. **Como Web App**: Desplegar como aplicación web desde Apps Script

### Flujo de Trabajo típico:
1. Escribir matrícula del estudiante
2. Seleccionar de las sugerencias automáticas
3. Elegir categoría de crédito
4. Ingresar cantidad de créditos (0.5 a 20, en incrementos de 0.5)
5. Subir certificado PDF
6. Confirmar carga

### Funcionalidades Avanzadas:

- **Validación en Tiempo Real**: El sistema verifica límites antes de procesar
- **Creación Automática de Carpetas**: Si un estudiante no tiene carpeta, se crea automáticamente 
- **Nombres de Archivo Inteligentes**: Los PDFs se renombran automáticamente con formato consistente
- **Control de Excesos**: Si se intenta superar un límite, solo se asignan los créditos permitidos

## 🔧 Personalización

### Cambiar Límites de Categorías:
Editar las constantes `LIMITES_CATEGORIA` en:
- `Código.js` (línea ~10)
- `index.html` (líneas ~100-110)

### Modificar Diseño:
- Colores y tema: `styles.html` → variables CSS en `:root`
- Layout: `index.html` → estructura HTML
- Comportamiento: `index.html` → sección `<script>`

### Agregar Nuevas Categorías:
1. Actualizar constantes `LIMITES_CATEGORIA`
2. Agregar opción en el `<select>` de `index.html`
3. Actualizar `categoriaCodeMap` en `Código.js`

## 🐛 Solución de Problemas

### Errores Comunes:

**"No se encontró el alumno"**
- Verificar que la matrícula esté en la hoja
- Comprobar formato (sin ceros iniciales)

**"Error al crear carpeta"**
- Verificar permisos de Drive
- Comprobar que `PARENT_FOLDER_ID` sea válido

**"Límite alcanzado"**
- Revisar créditos actuales del estudiante
- Verificar límites configurados

### Debugging:
- Abrir Apps Script Editor → Ver logs con `console.log()`
- Verificar ejecuciones en "Ejecuciones"
- Comprobar permisos en "Servicios"

## 📈 Métricas y Auditoría

El sistema registra automáticamente:
- Fecha y hora de cada carga
- Usuario que realizó la operación
- Intentos de exceder límites
- Archivos subidos y ubicaciones

Los logs se almacenan en:
- Columna de auditoría (última columna + 1)
- Logs de Google Apps Script
- Historial de versiones de Drive

## 📞 Soporte y Contacto

- 📧 **Contacto DEI**: dei@uc.edu.py
- 🛠️ **Desarrollador**: omar.irrazabal@uc.edu.py

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Última actualización**: Octubre 2025  
**Desarrollado con ❤️ por**: Omar Irrazabal (OI)  
**Universidad Católica "Nuestra Señora de la Asunción"** - Departamento de Electrónica e Informática
