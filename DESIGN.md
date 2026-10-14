---
name: Carmay Outfit
description: Tienda de moda, calzado y tecnología en Camagüey, Cuba
colors:
  primary: "#6d1e68"
  primary-light: "#a855f7"
  secondary: "#D4AF37"
  secondary-light: "#F5D76B"
  background: "#090b11"
  background-card: "rgba(15, 17, 28, 0.6)"
  surface: "#0e1019"
  text-primary: "#f3f4f6"
  text-secondary: "#9ca3af"
  accent-orange: "#f97316"
  accent-amber: "#f59e0b"
  accent-rose: "#f43f5e"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  heading:
    fontFamily: "Outfit, sans-serif"
    fontWeight: 800
    textWrap: "balance"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  neo-card:
    backgroundColor: "rgba(15, 17, 28, 0.6)"
    backdropFilter: "blur(20px)"
    border: "1px solid rgba(255, 255, 255, 0.06)"
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)"
    borderRadius: "{rounded.lg}"
  neo-card-hover:
    border: "1px solid rgba(255, 255, 255, 0.1)"
    boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
  button-primary:
    background: "linear-gradient(to right, #f59e0b, #f97316)"
    textColor: "#ffffff"
    borderRadius: "{rounded.xl}"
    padding: "16px 32px"
    fontWeight: 800
  button-secondary:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    border: "1px solid rgba(255, 255, 255, 0.1)"
    borderRadius: "{rounded.xl}"
    padding: "16px 32px"
---

## Overview

Diseño dual de alta costura: modo oscuro profundo por defecto (neo-dark) y modo claro marfil/slate de alta legibilidad, preservando los acentos morados y dorados de Carmay Outfit que transmiten calidad y lujo accesible.

## Colors

### Primarios de Marca
- **Morado Carmay** (`#6d1e68` / claro `#7e22ce`): Color principal de marca, acentos y gradientes
- **Morado Luminoso** (`#a855f7`): Highlights y badges secundarios

### Secundarios de Calidad
- **Dorado Carmay** (`#D4AF37` / `#d97706`): Títulos de acento y botones principales "Comprar Ahora"
- **Dorado Claro** (`#F5D76B`): Variante para gradientes y énfasis

### Superficies (Modo Oscuro)
- **Background** (`#090b11`): Negro suavizado, fondo principal
- **Surface** (`#0f1120`): Superficie de cards y componentes
- **Card** (`rgba(15, 17, 28, 0.75)`): Fondo glassmorphism con blur
- **Texto Primario** (`#f3f4f6` / `#ffffff`): Contraste máximo
- **Texto Secundario** (`#9ca3af` / `#cbd5e1`): Metadatos y notas

### Superficies (Modo Claro)
- **Background** (`#f8fafc` / `#f1f5f9`): Slate suave marfil, fondo principal
- **Surface** (`#ffffff`): Blanco puro para tarjetas, modales y drawers
- **Card** (`rgba(255, 255, 255, 0.95)`): Elevación suave con borde `rgba(15, 23, 42, 0.08)`
- **Texto Primario** (`#0f172a`): Slate 900 de alto contraste WCAG AAA
- **Texto Secundario** (`#475569`): Slate 600 altamente legible

### Acentos Oficiales de Precios
- **Naranja CUP** (`#f97316` / `#ea580c`): Precio oficial en CUP
- **Esmeralda USD** (`#34d399` / `#059669`): Precio oficial en USD
- **Rosa Ofertas** (`#f43f5e`): Descuentos y rebajas activas

## Typography

### Display (Outfit)
- Títulos principales y hero
- Weight: 800-900
- Tracking: -0.02em
- Text wrap: balance

### Body (Plus Jakarta Sans)
- Texto corrido y descripciones
- Weight: 400-500
- Line height: 1.6
- Medida comfortable: 65-75ch

### Jerarquía
- h1: clamp(1.875rem, 4vw, 3rem)
- h2: clamp(1.5rem, 3vw, 2.25rem)
- h3: clamp(1.25rem, 2vw, 1.875rem)
- body: 1rem
- small: 0.875rem
- Mínimo de legibilidad: 0.75rem (12px) — nunca usar tamaños inferiores en texto funcional

## Layout

### Grid
- Max width: 1280px (container)
- Gap: 24px (gap-6)
- Responsive: 1 col mobile → 2 col desktop

### Spacing Scale
- Section padding: 64px vertical
- Card padding: 24-32px
- Element gap: 16-24px

### Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

## Elevation & Depth

### Sombras
- **Card**: `0 4px 30px rgba(0, 0, 0, 0.3)`
- **Card hover**: `0 8px 40px rgba(0, 0, 0, 0.4)`
- **Glow purple**: `0 0 60px rgba(168, 85, 247, 0.08)`
- **Glow amber (halo de hover)**: `inset 0 0 0 1px rgba(234, 179, 8, 0.15)` — halo dorado de marca sobre cards y CTAs

### Glassmorphism
- Backdrop blur: 20px
- Border: 1px solid rgba(255, 255, 255, 0.06)
- Inner highlight: inset 0 1px 0 rgba(255, 255, 255, 0.03)

### Grid Overlay
- Líneas sutiles: rgba(255, 255, 255, 0.015)
- Tamaño de celda: 4rem × 4rem
- Opacidad: 40%

## Shapes

### Border Radius
- Buttons: 16-24px (rounded-2xl)
- Cards: 12-16px
- Badges: 9999px (full)
- Images: 12-16px

### Bordes
- Cards: 1px solid rgba(255, 255, 255, 0.06)
- Hover: 1px solid rgba(255, 255, 255, 0.1)
- Neo-line: gradiente horizontal purple → gold

## Components

### Neo Card
```
background: rgba(15, 17, 28, 0.6)
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.06)
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3)
border-radius: 16px
```

### Primary Button
```
background: linear-gradient(to right, #f59e0b, #f97316)
color: white
padding: 16px 32px
border-radius: 24px
font-weight: 800
shadow: 0 4px 15px rgba(249, 115, 22, 0.3)
```

### Secondary Button
```
background: transparent
color: white
border: 1px solid rgba(255, 255, 255, 0.1)
padding: 16px 32px
border-radius: 24px
```

### Badge
```
background: rgba(168, 85, 247, 0.4)
color: #f59e0b
border: 1px solid rgba(168, 85, 247, 0.5)
border-radius: 9999px
padding: 6px 14px
font-size: 0.75rem
font-weight: 700
```

## Do's and Don'ts

### Do's
- Usar la paleta morado-dorada consistentemente
- Mantener contraste adecuado (4.5:1 mínimo)
- Usar glassmorphism con moderación
- Aplicar hover states en todos los interactivos
- Mantener jerarquía visual clara

### Don'ts
- No usar colores fuera de la paleta
- No exceder blur en glassmorphism
- No usar sombras duras (sin blur)
- No saturar la interfaz con efectos
- No cambiar tipografías sin razón