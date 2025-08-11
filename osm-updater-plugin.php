<?php
/*
Plugin Name: OSM Editor/Updater Plugin
Description: Bearbeite den Datensatz der Wiener Gruppen aus der JS-Datei (Datenbank) über eine Admin-Tabelle. Damit wird die Karte der Gruppen sowie die Tabelle aktualisiert. Tipp: wenn du keine Änderungen siehst lösche den Cache serverseitig. 
Version: 2.0
Author: Sirknival 
*/

defined('ABSPATH') or die('Kein Zugriff');

define('OSM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('OSM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OSM_DATA_SOURCE', '/openscoutmap/data/OpenScoutMapData.js');
/* Script also defined in line 126 */

function osm_add_admin_menu() {
    add_menu_page(
        'OSM Updater',
        'OSM Updater',
        'manage_options',
        'json-editor',
        'osm_admin_page',
        'dashicons-edit',
        80
    );
}
add_action('admin_menu', 'osm_add_admin_menu');

function osm_admin_page() {
    include OSM_PLUGIN_DIR . 'admin-ui.php';
}

function osm_enqueue_admin_assets($hook) {
    if ($hook !== 'toplevel_page_json-editor') return;

    wp_enqueue_style('osm-admin-style', OSM_PLUGIN_URL . 'css/admin.css');
    wp_enqueue_script('osm-admin-script', OSM_PLUGIN_URL . 'js/admin.js', ['jquery'], null, true);

    $js_file = $_SERVER['DOCUMENT_ROOT'] . OSM_DATA_SOURCE;
    //$js_file = OSM_PLUGIN_DIR . 'data/data.js';
    $content = file_get_contents($js_file);

    // Regex: var geojsonFeature = [...];
    preg_match('/var\s+geojsonFeature\s*=\s*(\[.*\]);/s', $content, $matches);
    $json_data = isset($matches[1]) ? $matches[1] : '[]';

    $parsed = json_decode($json_data, true);
    if ($parsed === null) $parsed = [];

    wp_localize_script('osm-admin-script', 'geojsonData', $parsed);
}
add_action('admin_enqueue_scripts', 'osm_enqueue_admin_assets');

// AJAX zum Speichern
add_action('wp_ajax_osm_save_json', 'osm_save_json_callback');
function osm_save_json_callback() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Nicht autorisiert');
    }

    $new_data = $_POST['data'] ?? '';
    $decoded = json_decode(stripslashes($new_data), true);
    if ($decoded === null) {
        wp_send_json_error('Ungültiges JSON');
    }

    // Erzeuge JS-Datei-Inhalt mit var-Statement
    $js_code = "var geojsonFeature  = " . json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";\n";

    $file = $_SERVER['DOCUMENT_ROOT'] . OSM_DATA_SOURCE;
    $saved = file_put_contents($file, $js_code);

    if ($saved === false) {
        wp_send_json_error('Fehler beim Speichern');
    }

    wp_send_json_success('Datei gespeichert');
}

function osm_group_table_filter_shortcode() {
    ob_start(); ?>

    <table id="group-table" class="display" style="width:100%">
        <thead>
            <tr>
                <th>Gruppe</th>
                <th>Adresse</th>
                <th>PLZ</th>
                <th>Altersstufen</th>
                <th>Website</th>
            </tr>
        </thead>
        <tbody>
            <!-- Zeilen werden per JS eingefügt -->
        </tbody>
    </table>

    <?php
    return ob_get_clean();
}
add_shortcode('group-table-filter', 'osm_group_table_filter_shortcode');

// JS & CSS für DataTables einbinden
function osm_enqueue_group_table_assets() {
    if (is_singular()) { // nur auf einzelnen Beiträgen/Seiten
        wp_enqueue_script('datatables-js', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js', array('jquery'), null, true);
        wp_enqueue_style('datatables-css', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');

        wp_enqueue_script('datatables-resp-js', 'https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js', array('jquery'), null, true);
        wp_enqueue_style('datatables-resp-css', 'https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css"');


        // Dein Custom Script
        wp_enqueue_script(
            'group-table-filter-js',
            OSM_PLUGIN_URL . 'js/group-table-filter.js',
            array('jquery', 'datatables-js'),
            null,
            true
        );

        wp_enqueue_style('osm-age-group-styles', OSM_PLUGIN_URL . 'css/age_group-styles.css', [], '1.0');


        // URL zur externen JS-Datenquelle bereitstellen
        wp_localize_script('group-table-filter-js', 'OSMGroupTable', array(
            'dataUrl' => 'https://wpp.at/openscoutmap/data/OpenScoutMapData.js'
        ));
    }
}
add_action('wp_enqueue_scripts', 'osm_enqueue_group_table_assets');