<?php

if (! defined('WP_DEBUG')) {
	die( 'Direct access forbidden.' );
}

add_action( 'wp_enqueue_scripts', function () {
	// Cargar estilo del tema padre
	wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
	
	// Cargar estilo del tema hijo (style.css) con Cache Busting automático usando el timestamp de modificación
	$css_file = get_stylesheet_directory() . '/style.css';
	$version = file_exists($css_file) ? filemtime($css_file) : '1.0.0';
	
	wp_enqueue_style( 'child-style', get_stylesheet_directory_uri() . '/style.css', array( 'parent-style' ), $version );
});
