# Documento de Revisión Manual y Plan de Implementación (REVISION_MANUAL.md)

Este documento recopila de manera íntegra, clasificada y estructurada el feedback manual recibido por parte del equipo evaluador (**Alvaro** y **Betty♥️**) el 24 de septiembre de 2026 sobre la tienda online **Carmay Outfit (CarmayWeb)**, junto con el análisis técnico, dictamen de viabilidad y la hoja de ruta de implementación dividida por niveles de complejidad.

---

## 1. Registro Crudo de Observaciones Recibidas

A continuación se indexan las 57 intervenciones textuales originales para trazabilidad histórica:

1. `[4:25 p. m., 24/9/2026] Alvaro`: Hacer que el navbar empuje el contenido para que no se ocupe debajo de este.
2. `[4:26 p. m., 24/9/2026] Alvaro`: Centrate el carrusel del navbar.
3. `[4:27 p. m., 24/9/2026] Alvaro`: Tener menos sensibilidad a la animación del navbsr.
4. `[4:29 p. m., 24/9/2026] Alvaro`: Las card del contáctanos aumentar los textos.
5. `[4:29 p. m., 24/9/2026] Alvaro`: Cambiar el texto de respuestas a alguno diferente a negociar con bettyv.
6. `[4:30 p. m., 24/9/2026] Alvaro`: En el menú de navegación móvil ponerle contactanos.
7. `[4:33 p. m., 24/9/2026] Alvaro`: Demasiado info en el contáctanos revaluar contenido.
8. `[4:34 p. m., 24/9/2026] Alvaro`: Agrega el link de Google Maps directamente en la card de la dirección de la tienda.
9. `[4:35 p. m., 24/9/2026] Alvaro`: Unir el panel de la ubicación de la tienda con la imagen y reducir la duplicidad de los textos.
10. `[4:35 p. m., 24/9/2026] Alvaro`: Cambiar img de categoría.
11. `[4:39 p. m., 24/9/2026] Alvaro`: Productos relacionados. Elegí un tenis y me salieron zapatos de tacón y sandalias.
12. `[4:41 p. m., 24/9/2026] Alvaro`: Te paso lo mismo que la vez pasada. Cuando elijo un producto me lanza a la compra y no me deja seguir eligiendo.
13. `[4:45 p. m., 24/9/2026] Alvaro`: Mejoras sistema de recomendaciones.
14. `[4:47 p. m., 24/9/2026] Alvaro`: Mejor el centrado el móvil.
15. `[4:47 p. m., 24/9/2026] Alvaro`: Mejoras el flujo poniendo textos descriptivos , botón de seguir comprando.
16. `[4:50 p. m., 24/9/2026] Alvaro`: No se están actualizando correctamente los precios.
17. `[4:50 p. m., 24/9/2026] Alvaro`: Mejorar la organización de los productos en sub categorías.
18. `[8:48 p. m., 24/9/2026] Betty♥️`: El icono de atención al cliente no se define bien. No se entiende que son Audífonos con micrófonos como de operador. Parecen Audífonos y puede que la gente no lo identifique como lo que es.
19. `[8:49 p. m., 24/9/2026] Betty♥️`: Pienso que distinguir el color del precio en usd y el precio en cup estaría bien. Varialos un poco en tono al menos.
20. `[8:50 p. m., 24/9/2026] Betty♥️`: Te falta la elección de tallas y colores.
21. `[8:51 p. m., 24/9/2026] Betty♥️`: El comentario de Queda 1 no se siente bien. Añade algo como Solo queda 1. Es tu última oportunidad de tenerlo, Casi agotado. Única en stock. Y que los vayas variando. Lo mismo pasa con el comentario de En stock. Si pudieras variar entre productos los comentarios estaría genial.
22. `[8:52 p. m., 24/9/2026] Betty♥️`: Xq para mi en stock no me llama la atención es simplemente algo que das por hecho xq si no no estaría en el catálogo.
23. `[8:53 p. m., 24/9/2026] Betty♥️`: Donde se puedan subir encuestas. O un catálogo de productos que quisieran optener E incluso precomprad.
24. `[8:56 p. m., 24/9/2026] Betty♥️`: En detalles la descripción del producto es exactamente igual que en todos. La información que sale cuando pincho detalles es nimia. No vale la pena siquiera pinchar ahí. Voy directo a la bolsa y ya. Xq hacen la misma función solo que el diseño es diferente.
25. `[8:57 p. m., 24/9/2026] Betty♥️`: En el carrito el icono es una bolsa. Y dice tu carrito. Me parece una contradicción visual. O pones un carrito o Le cambias el nombre.
26. `[8:57 p. m., 24/9/2026] Betty♥️`: La ropa igual que los accesorios y todo lo demas deberías ponerla por categorías.
27. `[8:58 p. m., 24/9/2026] Betty♥️`: Es mas fácil para el cliente buscar.
28. `[8:58 p. m., 24/9/2026] Betty♥️`: Quizás en vez de poner carpetas como hiciste con la ropa acc calzado etc. Puedes ponerlo arriba como en un menu.
29. `[9:00 p. m., 24/9/2026] Betty♥️`: Ese espacio está por gusto y se ve feo e incompleto. O le pones comentarios cómicos o lo quitas.
30. `[9:01 p. m., 24/9/2026] Betty♥️`: El logo cuando abres la hamburguesa. Que se vea mas grande.
31. `[9:01 p. m., 24/9/2026] Betty♥️`: El que dice tienda (todo el catálogo)o pones catálogo o pones tienda y punto. Están cheos los parentisis.
32. `[9:02 p. m., 24/9/2026] Betty♥️`: Abajo en la parte de contacto hay muy poco espacio y parece que hay algo mas abajo pero no lo hay. Dale espacio xq es molesto.
33. `[9:05 p. m., 24/9/2026] Betty♥️`: No me dijiste la otra vez que ponías marcar por defecto el envío a domicilio para incentivar los envíos. No me parece mala idea y no lo veo esta vez.
34. `[9:07 p. m., 24/9/2026] Betty♥️`: Y q pasa si un cliente quiere pagar parte en transferencia y parte en efectivo.
35. `[9:08 p. m., 24/9/2026] Betty♥️`: No veo opciones.
36. `[9:08 p. m., 24/9/2026] Betty♥️`: Texto moda calzado y tecnología. La palabra calzado la hayo innecesaria.
37. `[9:10 p. m., 24/9/2026] Betty♥️`: La parte de navegación, si es necesaria correla hacia abajo. No creo que sea tan importante. Pon el texto de detalle y contacto mas corto. Y en vez de la flecha hacia al lado pon algo como haz click aquí o la manito 👇 pero hacia abajo hacia el lado no me gusta.
38. `[9:17 p. m., 24/9/2026] Betty♥️`: El cartel de ahorras no me convence para la página pero bueno.
39. `[9:18 p. m., 24/9/2026] Betty♥️`: Le falta el símbolo de peso.
40. `[9:18 p. m., 24/9/2026] Betty♥️`: Y quedan desfasados cuando los productos están uno al lado del otro.
41. `[9:19 p. m., 24/9/2026] Betty♥️`: Tienes que ver los primeros productos que salen.
42. `[9:19 p. m., 24/9/2026] Betty♥️`: Eso es importante.
43. `[9:20 p. m., 24/9/2026] Betty♥️`: Que salgan los q están en tendencia por ejemplo.
44. `[9:21 p. m., 24/9/2026] Betty♥️`: Pero bueno es que hay muchos que están en tendencia que estan dudosos para poner al inicoo.
45. `[9:26 p. m., 24/9/2026] Betty♥️`: Y en serio si pudieras hacerle un modo en blanco estaría genial.
46. `[9:41 p. m., 24/9/2026] Alvaro`: Truncar los nombres de los productos para generar ansiedad.
47. `[9:43 p. m., 24/9/2026] Alvaro`: Hay sobresaliente de los precios.
48. `[9:43 p. m., 24/9/2026] Alvaro`: Se salen de la caja.
49. `[9:47 p. m., 24/9/2026] Alvaro`: Estudiar como optimizar espacio entre elementos.
50. `[9:48 p. m., 24/9/2026] Alvaro`: Img en móvil eliminarla en Hero.
51. `[10:01 p. m., 24/9/2026] Alvaro`: Mejorar el grid para mostrar varios productos.
52. `[10:05 p. m., 24/9/2026] Alvaro`: Mejorara la alineación del footer en móvil.
53. `[10:07 p. m., 24/9/2026] Alvaro`: La garantía que provee tienda es que probamos los productos.
54. `[10:08 p. m., 24/9/2026] Alvaro`: Responder más directamente las preguntas de manera concreta.
55. `[10:09 p. m., 24/9/2026] Alvaro`: Resaltar con negrita el horario y ubicación.
56. `[10:09 p. m., 24/9/2026] Alvaro`: Texto de valor va en negritas ejem también los días que se trabaja.
57. `[10:10 p. m., 24/9/2026] Alvaro`: Separar preguntas de garantía y luego la de los productos que ofrecemos.
58. `[10:10 p. m., 24/9/2026] Alvaro`: Resumir las preguntas.
59. `[10:11 p. m., 24/9/2026] Alvaro`: Estructurar la respuesta de la pregunta 1 por puntos.
60. `[10:21 p. m., 24/9/2026] Alvaro`: Organizar el navbar.
61. `[10:21 p. m., 24/9/2026] Alvaro`: Eliminar contacto y poner un buscador reducido.
62. `[10:22 p. m., 24/9/2026] Alvaro`: Mover carrito 🛒 a un botón flotante.
63. `[10:24 p. m., 24/9/2026] Alvaro`: Probar cordón de info en vez de carrusel con frases cómicas.
64. `[10:24 p. m., 24/9/2026] Alvaro`: Para el carrusel del navbar.
65. `[10:40 p. m., 24/9/2026] Alvaro`: Agregar degradado entre fondo morados sólidos y el fondo negro.
66. `[10:40 p. m., 24/9/2026] Alvaro`: Resumir visión.
67. `[10:40 p. m., 24/9/2026] Alvaro`: Justificar texto.
68. `[10:41 p. m., 24/9/2026] Alvaro`: Eliminar uno de los textos pero con el fondo cómico morado.
69. `[10:45 p. m., 24/9/2026] Alvaro`: Productos con descripción real como eco flow se pone en detalles ropa y demás basura no.
70. `[10:45 p. m., 24/9/2026] Alvaro`: Icono de billetes en descripción cambiarlo.
71. `[10:46 p. m., 24/9/2026] Alvaro`: Poner la posibilidad de introducir el dato de la cantidad de productos.
72. `[10:47 p. m., 24/9/2026] Alvaro`: Validar que la cantidad máxima a elegir concuerde con el stock actual.
73. `[10:48 p. m., 24/9/2026] Alvaro`: Darle la opción de pasarce de stock ofreciéndole una precompra o encargo del producto.
74. `[10:52 p. m., 24/9/2026] Alvaro`: Buscar de que manera en el catalogo poner los productos como todos o que se yo.
75. `[10:53 p. m., 24/9/2026] Alvaro`: Definitivamente usar modo grid de Pinterest.

---

## 2. Decisiones Estratégicas y Dictámenes de Implementación

1. **Nomenclatura Unificada:** Adopción estricta de la palabra **"Catálogo"** en todo el sitio para sustituir expresiones como "Tienda", "Tienda (todo el catálogo)", etc.
2. **Arquitectura del Header a 2 Pisos:**
   - **Piso 1 (Fijo):** Logo corporativo a la izquierda, buscador interactivo espacioso al centro, botón de menú hamburguesa a la derecha.
   - **Piso 2 (Colapsable al scroll):** Carrusel de mensajes de valor optimizado y centrado, con tipografía más grande en móvil (`text-xs`/`text-sm font-bold`).
   - **Atención al Cliente:** Se traslada dentro del menú hamburguesa desplegable para otorgarle amplitud total al buscador.
   - **Botón de Carrito Flotante (FAB):** Se extrae del header y pasa a ser un botón circular flotante en pantalla con contador reactivo, con animación suave de ocultación durante el scroll continuo para no entorpecer la lectura.
3. **Metáfora Visual del Carrito:** Se unifica globalmente bajo el ícono de **carrito de compras tradicional (`shopping-cart`)**, erradicando la confusión con la bolsa de compras.
4. **Espaciado Anti-Solapamiento y Anti-Hueco:** La reserva de espacio superior bajo el header sticky debe ser matemática y exacta, impidiendo que el contenido quede bajo la barra al cargar y evitando al mismo tiempo cualquier hueco o vacío antiestético.
5. **Precios y Desborde (Overflow):** Solución inmediata mediante `flex-wrap` controlado y tipografía elástica para evitar que cifras grandes en CUP desborden la card. Contraste cromático diferenciado entre CUP (moneda base destacada) y USD (divisa secundaria en tono complementario).
6. **Flujo de Navegación "Seguir Comprando":** Botón de salida explícito en `CartDrawer` que permite cerrar el panel y continuar explorando sin forzar al usuario a dirigirse a la pasarela de compra.
7. **Desestimación de Pagos Mixtos / Transferencias:** La pasarela mantiene exclusivamente efectivo en CUP/USD y Zelle. No se implementarán transferencias fraccionadas ni pagos mixtos en el checkout.
8. **Características Diferidas para Futuras Iteraciones (Roadmap):**
   - **Motor de Recomendaciones Avanzado / Semántico:** Se desarrollará un algoritmo de similitud por tokens para evitar disparidades entre categorías (ej. tenis vs. tacones).
   - **Selector de Tallas y Colores:** Queda a la espera de que el backend de WooCommerce sincronice los atributos de variación en el esquema API.
   - **Modo Claro / Modo Oscuro (Light & Dark Theme):** Planificado como fase de diseño integral con tokens semánticos completos.

---

## 3. Plan de Acción por Fases Secuenciales

### Nivel 1: Cambios Inmediatos (Nomenclatura, Iconos, Enlaces y Microcopia)
- [x] Renombrar "Tienda" y variantes a **"Catálogo"** en navegación, drawer, footer y breadcrumbs.
- [x] Sustituir íconos de bolsa por **carrito de compras tradicional (`shopping-cart`)** en `CartDrawer`, `ProductCard`, `producto/[slug]` y estados vacíos.
- [x] Sustituir el ícono de soporte por un vector con diadema y micrófono visible (`headset` de atención al cliente).
- [x] Incrementar el tamaño y jerarquía del logo en el interior del menú hamburguesa móvil.
- [x] Agregar enlace directo con apertura en nueva pestaña a Google Maps en la dirección de la tienda física (`contact.astro` y `StoreBanner.astro`).

### Nivel 2: Pulido Visual, Contraste de Precios y Ajustes de Layout
- [x] Diferenciar visualmente los precios: CUP en tono principal de contraste alto (ámbar/oro) y USD en tono esmeralda divisa.
- [x] Corregir desborde de precios en `ProductCard.astro` garantizando contención estricta sin truncar números.
- [x] Nivelar la altura fija del listón de ahorro en las tarjetas de producto para evitar desalineación en la rejilla.
- [x] Calibrar el padding superior base (`body`/`main`) para evitar solapamientos con el header y eliminar cualquier hueco innecesario.
- [x] Ampliar el espaciado inferior (`padding-bottom`) en `/contact` para evitar compresión visual sobre el footer.

### Nivel 3: Experiencia de Usuario (UX) y Síntesis de Contenidos
- [x] Agregar botón explícito **"Seguir Comprando"** y enlace conciso **"Ver más →"** en `CartDrawer.astro`.
- [x] Generador de microcopia rotativa para stock en tarjetas ("¡Solo queda 1!", "Última oportunidad", "Disponible para entrega").
- [x] Reestructurar `/contact`: unificar la tarjeta de la tienda física con su fotografía oficial, reduciendo duplicidad de textos.
- [x] Reestructurar FAQ: lista continua tradicional de preguntas (una debajo de otra) con respuestas concisas en bullets y negritas.

### Nivel 4: Rediseño Estructural del Header, Buscador y Botón Flotante
- [x] Reconfigurar `Header.astro` asimétrico:
  - Móvil: Piso 1 con Logo + Buscador restaurado + Menú Hamburguesa. Piso 2 con Carrusel centrado.
  - Desktop: Piso 1 clásico con Logo + Enlaces centrados + Carrito en cabecera; SubNavbar con buscador y carrusel.
- [x] Implementar el **Botón Circular Flotante (FAB) del Carrito** exclusivo en móvil con animación lateral Peek-a-boo V43.1 completa (`translateX(95px)` en scroll, timer de 2s y sensor de proximidad a 80px).
- [x] Exponer barra ligera de categorías en móvil con scroll horizontal suave.
- [x] Rediseñar el buscador con resultados en lista compacta horizontal, 8 ítems por relevancia y botón de explorar en catálogo con ancla `#productos-section`.
- [x] Rediseñar catálogo estilo Pinterest / Temu: imagen protagonista `aspect-[4/5]`, títulos en 1 línea, precios en grid 2x2 llamativos y botón de agregar fino al final.

### Nivel 5: Mejoras de Producto y Registro de Roadmap
- [x] Selector interactivo de cantidad en `producto/[slug].astro` con tope validado por stock físico y opción de encargo por WhatsApp si se supera.
- [ ] *[Roadmap Futuro]* Implementación del recomendador semántico estricto.
- [ ] *[Roadmap Futuro]* Selector de tallas y colores cuando la API exponga las variaciones.
- [ ] *[Roadmap Futuro]* Estrategia de Tema Dual (Modo Claro / Modo Oscuro).
