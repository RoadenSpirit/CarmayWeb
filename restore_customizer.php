<?php
global $wpdb;

$post_id = 23;

$clean_customizer_css = '/* =======================================================
   CARMAY OUTFIT: CSS PERSONALIZADO UNIFICADO (V7)
   ======================================================= */

/* === I. ESTILOS DE PRODUCTO EN HOME (Identidad Visual - Removido por conflicto de contraste) === */

/* === II. REGLAS GLOBALES PARA BOTONES (Todas las resoluciones) === */

/* Estado Hover y Active para: Añadir al carrito, Seleccionar opciones y Ver el carrito */
.home li.product .button:hover,
.home li.product .button:active,
.home li.product .add_to_cart_button:hover,
.home li.product .add_to_cart_button:active,
.home li.product .added_to_cart:hover,
.home li.product .added_to_cart:active {
    background-color: #e8edf0 !important;
    color: #6d1e68 !important; /* Texto en Morado Carmay para contraste */
    transition: background-color 0.2s ease-in-out !important;
    border-color: #e8edf0 !important;
}

/* === III. OPTIMIZACIÓN MÓVIL Y LIMPIEZA DE CAMPOS === */
@media (max-width: 768px) {
    
    /* 1. Ocultar campos innecesarios y variaciones */
    .home li.product .star-rating,
    .home li.product .entry-excerpt,
    .home li.product .woocommerce-loop-product__category,
    .home li.product li.meta-categories,
    .home li.product .variations,
    .home li.product .variable-items-wrapper, 
    .home li.product .woo-variation-swatches,
    .home li.product .tawcvs-swatches,
    .home li.product .swatches-select,
    .home li.product .quantity {
        display: none !important;
    }

    /* 2. Compactación de Espacios */
    .home li.product .woocommerce-loop-product__link img {
        margin-bottom: 4px !important;
    }

    .home li.product h2.woocommerce-loop-product__title {
        font-size: 0.85rem !important;
        margin: 0 0 2px 0 !important;
        line-height: 1.1 !important;
    }

    .home li.product span.price {
        display: block !important;
        margin-bottom: 6px !important;
        line-height: 1 !important;
        font-size: 0.95rem !important;
    }

    /* 3. Estructura de Rejilla (2 Columnas) */
    .home ul.products {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
        padding: 0 !important;
    }

    .home li.product {
        width: 100% !important;
        float: none !important;
        margin-bottom: 15px !important;
    }

    /* 4. Unificación de Botones en Móvil */
    .home li.product .button,
    .home li.product .added_to_cart {
        padding: 8px 10px !important;
        font-size: 0.8rem !important;
        width: 100% !important;
        margin: 0 !important;
        display: inline-block !important;
        text-align: center;
    }
}

/* === IV. BADGE DE CATEGORÍA Y OTROS === */
li.meta-categories a, .woocommerce-loop-product__category a {
    background-color: #f8f8f8 !important; color: #4b4141 !important;
    padding: 3px 7px !important; border-radius: 16px !important;
    font-size: 0.6875rem !important; border: 1px solid rgba(109, 30, 104, 0.15) !important;
}

/* === V. AJUSTES DE CHECKOUT, CONTACTO Y FOOTER === */
.carmay-delivery-field, .woocommerce-checkout .form-row .optional { 
    display: none !important; 
}

#billing_address_1_field.validate-required label .required, 
.carmay-delivery-field label .required { 
    display: inline !important; 
}

/* Ocultar footer en Carrito, Checkout y Página de Contacto (ID 672) */
body.woocommerce-cart #footer, 
body.woocommerce-checkout #footer,
body.woocommerce-cart #footer-widgets, 
body.woocommerce-checkout #footer-widgets,
body.page-id-672 #footer, 
body.page-id-672 #footer-widgets,
body.page-id-672 .ct-footer { 
    display: none !important; 
}';

$result = $wpdb->update(
    $wpdb->posts,
    array('post_content' => $clean_customizer_css),
    array('ID' => $post_id),
    array('%s'),
    array('%d')
);

if ($result !== false) {
    echo "Success: Customizer CSS V7 restored successfully!\n";
} else {
    echo "Error: Failed to restore Customizer CSS.\n";
}
