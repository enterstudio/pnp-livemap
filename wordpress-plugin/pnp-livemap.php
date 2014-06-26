<?php
/*
Plugin Name: Punctures & Panniers Livemap
Description: Livemap and "where we are" widget support
*/

// Creating the widget
class PNP_WhereWeAreWidget extends WP_Widget {

  function __construct() {
    parent::__construct(
      // Base ID of your widget
      'PNP_WhereWeAreWidget',

      // Widget name will appear in UI
      __('Where We Are Widget', 'pnp_widget_domain'),

      // Widget description
      array( 'description' => __( 'Shows country name and flag of current location', 'pnp_widget_domain' ), )
    );
  }

  // Creating widget front-end
  // This is where the action happens
  public function widget($args, $instance) {
    echo $args["before_widget"];
    $spinner_img_path = plugins_url() . '/pnp-livemap/img/spinner.gif';

    ?>
      <h1 class="widget-title">Currently Cycling... <img src="<?=$spinner_img_path?>" class="geo-spinner" width="26" height="26"></h1>
      <div class="geo-content">
          <img class="flag" width="32" height="32">
          <div class="place-text">Dartford, United Kingdom</div>
          <span class="sub"><span class="distance"></span> as of <time>Jun 9th, 1:24pm</time></span>
        <img class="minimap" width="279" height="201">
      </div>
      <div id="pnp-fullmap"></div>
    <?php

    echo $args["after_widget"];
  }

  // Widget Backend
  public function form($instance) {

  }

  // Updating widget replacing old instances with new
  public function update($new_instance, $old_instance) {
    $instance = array();
    $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
    return $instance;
  }
} // Class wpb_widget ends here

// Register and load the widget
function pnp_load_widget() {
  register_widget('PNP_WhereWeAreWidget');
}

add_action('widgets_init', 'pnp_load_widget');

/**
 * Proper way to enqueue scripts and styles
 */
function pnp_enqueue_head() {
  wp_enqueue_style('pnp-livemap',  plugins_url() . '/pnp-livemap/css/style.css');

  wp_enqueue_script('google-maps', 'http://maps.googleapis.com/maps/api/js?libraries=geometry&key=AIzaSyB4du1SngujDMVsO91yl14Q5rzmQp7eytM', array(), '1.0.0', true);
  wp_enqueue_script('lightbox_me', plugins_url() . '/pnp-livemap/js/lightbox_me.js', array(), '1.0.0', true);
  wp_enqueue_script('underscore', plugins_url() . '/pnp-livemap/js/underscore.min.js', array(), '1.0.0', true);
  wp_enqueue_script('pnp-livemap', plugins_url() . '/pnp-livemap/js/script.js', array(), '1.0.0', true);
}

add_action('wp_enqueue_scripts', 'pnp_enqueue_head');

?>