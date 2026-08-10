# SPECIFICATIONS.md

### 1. Goal
Rediseñar la web de Carmay Outfit a la vista actual, siguiendo un enfoque moderno y estilizado inspirado en ia.carmayn8n.cloud, garantizando que el sitio sea completamente mobile-first y que la experiencia sea coherente con los estándares visuales actuales.

### 2. Datos Técnicos Actuales

- **Plataforma actual:** WordPress + WooCommerce
- **Dominio principal:** https://carmayoutfit.com
- **Dominio temporal de prueba:** https://aqua-raven-173850.hostingersite.com/
- **Frameworks actuales:** WordPress + WooCommerce + Blocksy (tema hijo)
- **Escritorio actual:** Acceso vía SSH a srv1571201 (72.62.96.82) con privilegios SSH

### 3. Requisitos Funcionales (What)

| Requisito | Descripción | Prioridad |
|---|---|---|
| **Índice Inicial** | Diseño que destaque el hero con imagen de tienda, tipografía moderna, y efectos de degradados. | Alta |
| **Catálogo de Productos** | Tarjetas móviles de productos con estrellas de valoración reemplazadas por texto, botones de añadir al carrito con transiciones suaves y visuales de comercio actualizado. | Alta |
| **Categorías Destacadas** | 5 tarjetas con iconos de favoritos que redirijan directamente al catálogo: Calzado, Ropa, Bolsos y Mochilas, Tecnología, Accesorios. | Alta |
| **Valor Añadido** | Incluir secciones para: "Valor Añadido", "Quiénes Somos", "Novedades y Ofertas", "Valoración de Clientes", "FAQ", "Footer Moderno". | Alta |
| **Interactividad** | Animaciones degradadas, efectos blur/glassmorphism, microinteracciones y modalidad de diseño en "Pantalla completa" para vista previa de escritorio. | Alta |

### 4. Análisis de Contenido Actual

- La página de inicio actual presenta:
  - Diseño *flat* (sin sombra ni texturas).
  - Tipografía standard (Arial/Helvetica) que no corresponde a la estética premium.
  - Productos sin marcos modernos, gradientes o dinámica visual.
  - Botones clásicos y estáticos sin estados hover efectivos.
- La página es responsive (mobile friendly) pero carece de elementos visuales sofisticados y modernos que justifiquen la "premium".

### 5. Resultados Esperados (What)

El nuevo diseño debe:
- Tener **clase moderna con fondos oscuros y acentos vibrantes**.
- Incluir **categorías de producto destacadas** en la home (calzado, ropa, bolsos, tecnología, accesorios).
- **Funcionamiento en móvil** con gesto natural de deslizamiento.
- **Animaciones de entrada** con blur, hover y efectos de color adaptadas a móviles y escritorio.
- **Footer** moderno con opciones de contacto, redes sociales, y enlace al sitio de prueba con ia.carmayn8n.cloud.

### 5. Especificaciones Técnicas

| Elemento | Requisito | Detalle |
|---------|-----------|---------|
| **Tema** | WordPress con WooCommerce | Sí, se conservan funcionalidades pero se cambio el frontend |
| **Tema Hijo** | Blocksy Child (directo desde `functions.php`) |  |
| **Frameworks** | WordPress + WooCommerce |  |
| **Diseño del Tema** | Único, responsive, 100% mobile-first |  |
| **Paleta de Colores** | Negros oscuros, morado `#6d1e68`, acentos vibrantes `#e8edf0` y `#e8edf0` (blanco crema) |  |
| **Efectos Visuales** | Blur, glassmorphism, animaciones CSS, gradientes dinámicos |  |
| **Mobile-First** | Diseño completo adaptable para móviles pequeños (320px - 1024px), con breakpoint en tablet (≥768px) |  |
| **Aplicar en todos los archivos del tema** | Incluyendo `functions.php` del tema y CSS específico en `custom_v7.css` (para cambios por WWC) |  |

---

## 3. Pathway de Implementación (Carpeta / Proyecto)

### Fase 1: Preparación y Estructura

1. **Crear repositorio nuevo o limpiar el actual (`main`) en GitHub.**
2. **Mantener el portal Live con la versión actual de WordPress** para evitar interrupciones.
3. **Clonar la estructura base de CarmayWeb** (ya existente en repositorio).

### Fase 2: Diseño Específico por Sección

#### **2.1. Header (Header)**
- Implementar grid layout de 3 filas: logo → menú → botones CTA y contactos.
- **Header en modo responsive**: desplazamiento del logo a la izquierda, botones a la derecha en escritorio, y menú hamburguesa en móvil.

#### **2.2. Sección Hero Principal**
- **Imagen principal:** Zoomed-in (200-10% zoom) de una foto profesional de la tienda de Camay Outfit.
- **Título principal:** Título grande (36-48px) en contraste brillante con fondo oscuro: *“Vestir con estilo, potenciado por IA”*.
- **Subtítulo secundario:** Breve frase resaltada con efecto *blur* y *text-shadow*.
- **Botones CTA:**
  - Principal: **“Ver Tienda”** (botón grande, gradient background #ff8c00→#ff0072, sombra sutil).
  - Secundario: **“Portal Carmay IA”** (texto premium, borde delgado, con conexión al portal de IA).

#### **C. Sección de Valores Añadidos**
- **Título:** “¿Por qué elegir Carmay Outfit?”
- **4 tarjetas con icono:** cada una con 2-3 líneas de texto, uso de iconos de línea desde Font Awesome o similar, color de acento morado (`#6d1e68`).
- **Efectos:** Transición *scale* suave en las tarjetas con hover.

### C. Sección de Productos Destacados (Catálogo Dinámico)

1. **Categorías de Producto (5 tarjetas en navegación rápida)**
   - **Calzado**
   - **Ropa**
   - **Bolsos y Mochilas**
   - **Tecnología**
   - **Accesorios**

*Cada tarjeta incluye:*
- **Miniatura** con efecto *hover* (zoom + halo blur).
- **Etiqueta de categoría** con fondo de color de identificación y borde suave.
- **Botón “Ver"** con efecto de expansión/zoom cuando el cursor pasa por encima.

### 5. Páginas de Detalle de Producto
- Página de producto individual con:
  - **Galería de imágenes múltiples**
  - **Sección de valor** con promoción de precio, garantía y reembolso.
  - **Botón de acción principal** (Añadir al carrito) con sombra y efecto pulido.

---

### 3. **Fases de Implementación**

| Fase | Acción | Plazo Estimado |
|------|--------|-------------|
| **F1** | Fondo + CSS / Layout Básico | 1 día |
| **F2** | Implementación de Header & Hero + CSS externo | 2 días |
| **F3** | Renders de Productos y Tarjetas | 2 días |
| **F4** | Secciones Principales & Navegación | 1 día |
| **F5** | Validación con pruebas de usabilidad real | 1 día |
