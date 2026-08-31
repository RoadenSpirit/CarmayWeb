<?php
/**
 * Simulador de actividad para evaluar los filtros de la web headless.
 *
 * - OFERTAS: aplica `sale_price` (descuento aleatorio) a N productos y les
 *   asigna las etiquetas "Rebajas" (75) / "Ofertas Especiales" (76).
 * - VENTAS: asigna `total_sales` aleatorio a M productos (para el filtro
 *   "más vendidos" / orderby=popularity) SIN tocar el stock real.
 *
 * Re-ejecutable: primero limpia ofertas y etiquetas de oferta del run anterior.
 * No simula bajo stock (ya hay productos con stock bajo real).
 *
 * Configuración opcional por variables de entorno:
 *   SIM_COUNT_OFFERS   (default 20)
 *   SIM_COUNT_SALES    (default 25)
 *   SIM_MIN_DISCOUNT   (default 10)
 *   SIM_MAX_DISCOUNT   (default 35)
 *   SIM_MIN_SALES      (default 5)
 *   SIM_MAX_SALES      (default 60)
 *   SIM_EXCLUDE_LOW_STOCK (default 1: no ofertar productos con stock <= 3)
 *
 * Ejecutar:
 *   wp eval-file simulate_activity.php
 */

if (!defined('ABSPATH') || !function_exists('wc_get_product')) {
    // Ejecutar vía: wp eval-file simulate_activity.php  (WP ya cargado)
    fwrite(STDERR, "Este script debe ejecutarse con WP-CLI: wp eval-file simulate_activity.php\n");
    exit(1);
}

$countOffers   = (int) (getenv('SIM_COUNT_OFFERS') ?: 20);
$countSales    = (int) (getenv('SIM_COUNT_SALES') ?: 25);
$minDiscount   = (int) (getenv('SIM_MIN_DISCOUNT') ?: 10);
$maxDiscount   = (int) (getenv('SIM_MAX_DISCOUNT') ?: 35);
$minSales      = (int) (getenv('SIM_MIN_SALES') ?: 5);
$maxSales      = (int) (getenv('SIM_MAX_SALES') ?: 60);
$excludeLow    = (int) (getenv('SIM_EXCLUDE_LOW_STOCK') ?: 1) === 1;

$tagRebajas   = 75;
$tagOfertas   = 76;
$lowThreshold = 3;

// ------------------------------------------------------------
// 1) IDs de todos los productos publicados
// ------------------------------------------------------------
$ids = get_posts(array(
    'post_type'      => 'product',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'fields'         => 'ids',
    'orderby'        => 'ID',
));

if (empty($ids)) {
    fwrite(STDERR, "No hay productos publicados.\n");
    exit(1);
}

echo "Simulador iniciado con " . count($ids) . " productos.\n";

// ------------------------------------------------------------
// 2) Limpiar estado anterior: quitar sale_price y etiquetas de oferta
// ------------------------------------------------------------
foreach ($ids as $id) {
    $product = wc_get_product($id);
    if (!$product) {
        continue;
    }
    if ($product->get_sale_price() !== '') {
        $product->set_sale_price('');
        $product->save();
    }
    wp_remove_object_terms($id, array($tagRebajas, $tagOfertas), 'product_tag');
}

// ------------------------------------------------------------
// 3) OFERTAS: elegir productos aptos y aplicar descuento aleatorio
// ------------------------------------------------------------
$eligible = array();
foreach ($ids as $id) {
    $product = wc_get_product($id);
    if (!$product || !$product->is_in_stock()) {
        continue;
    }
    $regular = (float) $product->get_regular_price();
    if ($regular <= 0) {
        continue;
    }
    if ($excludeLow && $product->get_stock_quantity() !== null && $product->get_stock_quantity() <= $lowThreshold) {
        continue;
    }
    $eligible[] = $id;
}

shuffle($eligible);
$offerIds = array_slice($eligible, 0, min($countOffers, count($eligible)));

echo '--- OFERTAS (' . count($offerIds) . ") ---\n";
foreach ($offerIds as $id) {
    $product = wc_get_product($id);
    $regular = (float) $product->get_regular_price();
    $discount = random_int($minDiscount, $maxDiscount);
    $sale = round($regular * (1 - $discount / 100), 2);

    $product->set_sale_price(number_format($sale, 2, '.', ''));
    $product->save();

    wp_set_object_terms($id, array($tagRebajas, $tagOfertas), 'product_tag', true);

    echo sprintf(
        "  id=%d | %s | reg=%s | sale=%s | -%d%%%s\n",
        $id,
        $product->get_name(),
        number_format($regular, 2),
        number_format($sale, 2),
        $discount,
        $excludeLow && $product->get_stock_quantity() <= $lowThreshold ? ' (saltado: bajo stock)' : ''
    );
}

// ------------------------------------------------------------
// 4) VENTAS: asignar total_sales aleatorio (no toca stock)
// ------------------------------------------------------------
shuffle($ids);
$salesIds = array_slice($ids, 0, min($countSales, count($ids)));

echo '--- VENTAS (' . count($salesIds) . ") ---\n";
foreach ($salesIds as $id) {
    $product = wc_get_product($id);
    if (!$product) {
        continue;
    }
    $sales = random_int($minSales, $maxSales);
    update_post_meta($id, 'total_sales', $sales);
    echo sprintf("  id=%d | %s | total_sales=%d\n", $id, $product->get_name(), $sales);
}

// WooCommerce ordena "más vendidos" (orderby=popularity) leyendo la columna
// wc_product_meta_lookup.total_sales, NO wp_postmeta. Sincronizar aquí para que
// el REST API devuelva el orden correcto.
global $wpdb;
$lookupTable = $wpdb->prefix . 'wc_product_meta_lookup';
foreach ($salesIds as $id) {
    $sales = (int) get_post_meta($id, 'total_sales', true);
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT product_id FROM {$lookupTable} WHERE product_id = %d",
        $id
    ));
    if ($exists) {
        $wpdb->update($lookupTable, array('total_sales' => $sales), array('product_id' => $id));
    }
}

echo "Simulador finalizado.\n";