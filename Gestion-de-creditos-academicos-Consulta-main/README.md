
# 🎓 Sistema de Consulta de Créditos Académicos DEI

Proyecto desarrollado en Google Apps Script como parte del proceso de análisis de requerimientos de sistemas en el Departamento de Electrónica e Informática (DEI) de la Universidad Católica "Nuestra Señora de la Asunción".

Este sistema constituye un ejemplo de diseño e implementación de soluciones de automatización de procesos, enfocado en la consulta y visualización de los créditos académicos de estudiantes. Actualmente, el proyecto contiene el módulo de consulta para estudiantes y administrativos.

## 📋 Descripción

La aplicación surge como respuesta a la necesidad de contar con una herramienta que permita consultar de manera rápida, sencilla y visual el progreso de créditos académicos requeridos para la graduación en las carreras de ingeniería del DEI.

### ✨ Características principales

- 🔍 **Búsqueda dual**: Por matrícula o apellido
- 📊 **Visualización intuitiva**: Barras de progreso por categoría
- 📱 **Diseño responsivo**: Optimizado para dispositivos móviles con vista de tarjetas
- 🎨 **Interfaz moderna**: Diseño atractivo con gradientes y animaciones
- 📝 **Exportación a PDF**: Generación de informes en formato A4 vertical
- 📚 **Información completa**: Detalles de cada categoría de créditos
- 🕘 **Historial de búsquedas**: Búsquedas recientes guardadas localmente
- 🔄 **Modos de vista**: Vista simplificada y completa intercambiables
- 💳 **Vista móvil tipo tarjeta**: Diseño de tarjetas modernas para móviles
- 🎨 **Alta legibilidad**: Texto negro sobre fondos claros en móvil

## 🎯 Funcionalidades

### Para Estudiantes
- Consulta rápida de estado de créditos
- Indicadores visuales de progreso (20 créditos totales)
- Verificación de suficiencia en inglés
- Exportación de informes en formato PDF
- Información detallada de cada categoría
- Vista adaptativa según dispositivo (tabla en desktop, tarjetas en móvil)

### 📱 Vista Móvil Avanzada
- **Tarjetas modernas**: Diseño tipo card con avatar personalizado
- **Avatar con iniciales**: Círculo perfecto con las iniciales del estudiante
- **Estados visuales**: Colores distintivos para aprobado/pendiente/incompleto
- **Barras de progreso**: Visualización intuitiva del progreso en cada categoría
- **Texto optimizado**: Negro sobre fondos claros para máxima legibilidad
- **Responsive automático**: Cambia automáticamente entre tabla y tarjetas según el tamaño de pantalla
 

## 📂 Estructura del Proyecto

```
CreditosDEIGoogle/
├── Page.html          # Interfaz principal del usuario
├── JavaScript.html    # Código JavaScript del lado del cliente
├── Stylesheet.html    # Estilos CSS responsivos y vista móvil
├── ConfigJS.html      # Configuración y constantes del sistema
├── codigo.js          # Lógica del servidor (Apps Script)
├── appsscript.json    # Configuración del proyecto Google Apps Script
└── README.md          # Documentación del proyecto
```

## 🎨 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6
- **Backend**: Google Apps Script
- **Framework CSS**: Bootstrap 5.3.0
- **Bibliotecas JS**: jsPDF, html2canvas para exportación a PDF
- **Arquitectura**: Separación cliente-servidor, código modular
- **Responsive Design**: Media queries personalizadas para móvil/desktop
- **Fuentes**: Google Fonts (Segoe UI)
- **Iconos**: Emojis Unicode para mejor compatibilidad

## 🚀 Instalación y Configuración

### Requisitos previos
- Cuenta de Google
- Acceso a Google Apps Script
- Permisos para Google Sheets (base de datos)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/OIrrazabal/creditos-academicos-DEI.git
   ```

2. **Configurar Google Apps Script**
   - Crear nuevo proyecto en [script.google.com](https://script.google.com)
   - Subir archivos del proyecto
   - Configurar acceso a la hoja de cálculo de créditos

3. **Configurar permisos**
   - Autorizar acceso a Google Sheets
   - Configurar permisos de lectura de datos

4. **Desplegar como aplicación web**
   - Ir a "Implementar" > "Nueva implementación"
   - Tipo: "Aplicación web"
   - Acceso: Según requerimientos institucionales

## 🔧 Configuración de Desarrollo

### Usando clasp CLI
```bash
# Instalar clasp globalmente
npm install -g @google/clasp

# Autenticar con Google
clasp login

# Clonar proyecto existente
clasp clone [SCRIPT_ID]

# Desarrollar localmente y subir cambios
clasp push
```

### Variables de entorno
- Configurar acceso a hojas de cálculo de datos
 

## 📱 Diseño Responsivo

El sistema está optimizado para:
- 📱 **Móviles**: iPhone, Android (375px+) - Vista de tarjetas
- 📱 **Tabletas**: iPad, Android tabletas (768px+) - Vista híbrida
- 💻 **Escritorio**: Pantallas grandes (1200px+) - Vista de tabla completa

### Características adaptativas
- Tipografía fluida con `clamp()`
- Barras de progreso adaptativas
- **Vista móvil**: Tarjetas modernas con avatar y estado visual
- **Vista escritorio**: Tablas completas con todas las categorías
- Cambio automático de vista según el tamaño de pantalla
- Interfaz táctil optimizada para móviles
- Exportación a PDF compatible con ambas vistas

### 🎨 Vista Móvil - Características Especiales

#### 💳 Tarjetas de Estudiante
- **Avatar personalizado**: Círculo perfecto con iniciales del estudiante
- **Información destacada**: Nombre, carrera y matrícula prominentes
- **Estados visuales**: 
  - ✅ Verde claro para aprobado/completo
  - ⚠️ Amarillo claro para pendiente
  - ❌ Rojo claro para incompleto/faltante

#### 📊 Visualización de Progreso
- **Grilla de categorías**: Layout 2x3 para las 6 categorías (A-F)
- **Barras de progreso**: Indicadores visuales por categoría
- **Colores intuitivos**: 
  - Verde: Categoría completa
  - Amarillo: Progreso parcial
  - Rojo: Sin progreso o insuficiente

#### 🔤 Optimización de Legibilidad
- **Texto negro**: Máximo contraste sobre fondos claros
- **Fondos claros**: Blanco y grises muy claros
- **Jerarquía visual**: Diferentes tonos para títulos, subtítulos y datos
- **Accesibilidad**: Cumple estándares WCAG de contraste

## 🎨 Guía de Estilo

### Colores principales
```css
--primary-color: #1E2F8C    /* Azul DEI */
--hover-color: #152266      /* Azul DEI oscuro */
--secondary-color: #e9ecef  /* Gris claro */
--success-color: #28a745    /* Verde éxito */
--warning-color: #ffc107    /* Amarillo advertencia */
--danger-color: #dc3545     /* Rojo error */
```

### Tipografía
- Familia: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- Pesos: 400 (normal), 600 (semi-bold), 700 (bold)
- Tamaños responsivos con clamp()

## 🆕 Últimas Actualizaciones (Septiembre 2025)

### � Vista Móvil Renovada
- **Nuevas tarjetas de estudiante**: Diseño moderno tipo card con avatar personalizado
- **Avatar con iniciales**: Círculo perfecto que muestra las iniciales del estudiante
- **Mejora de legibilidad**: Todo el texto en negro sobre fondos claros para mejor contraste
- **Responsive automático**: Detección automática del tamaño de pantalla para cambiar vistas

### 🎨 Mejoras de Interfaz
- **Encabezados unificados**: Tanto vista simplificada como completa usan el mismo estilo azul
- **Optimización de colores**: Fondos más claros y mejor contraste en vista móvil
- **Corrección de avatar**: Avatar perfectamente redondo sin deformaciones
- **Texto negro uniforme**: Todas las categorías y valores en negro para mejor legibilidad

### 📊 Funcionalidades Mejoradas
- **Dos modos de vista**: Simplificada (datos esenciales) y Completa (todos los detalles)
- **Cambio dinámico**: Botones para alternar entre vistas sin recargar
- **Exportación mejorada**: PDF funciona correctamente con ambas vistas (tabla y tarjetas)
- **Detección de pantalla**: Adapta automáticamente la interfaz al redimensionar la ventana

## �🔒 Seguridad y Privacidad

- ✅ Datos estudiantiles protegidos
- ✅ Acceso controlado por autenticación de Google
- ✅ Sin almacenamiento local de datos sensibles
- ✅ Historial de búsquedas solo en almacenamiento local del navegador
- ✅ Comunicación HTTPS exclusivamente

## 📞 Soporte y Contacto

- 📧 **Contacto DEI**: dei@uc.edu.py
- 🛠️ **Desarrollador**: omar.irrazabal@uc.edu.py
- 📚 **Repositorio**: [github.com/OIrrazabal/creditos-academicos-DEI](https://github.com/OIrrazabal/creditos-academicos-DEI)

## Implementación
- La página para la gestión de los créditos es la siguiente: https://sites.google.com/uc.edu.py/creditosacademicosdei/inicio
- La página para consultar los créditos la cual corresponde a este proyecto es la siguiente: https://script.google.com/macros/s/AKfycbz9V8njmnOHOYVw9yt-aHtG-7HAIqGUhfRVYNUP_B7aicrRFvjtrPNGWBNQ1r3XHr9BNA/exec

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Última actualización**: Septiembre 2025  
**Desarrollado con** ❤️ **por**: Omar Irrazabal (OI)  
**Universidad Católica "Nuestra Señora de la Asunción"** - DEI
