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

    ?>
      <h1 class="widget-title">Currently Cycling...</h1>

      <p>
        <img class="flag" src="/wp-content/plugins/pnp-livemap/img/flags/United-Kingdom.png" scale="0" width="32" height="32">
        Dartford, United Kingdom
        <!--small><a href="" style="margin-left: 5px;">(show map)</a></small-->
        <br>
        <span class="ts">as of <time>Jun 9th, 1:24pm</time></span>
      </p>
      <img src="http://maps.googleapis.com/maps/api/staticmap?center=51.447122963145375%2C0.219824966043234&markers=color%3Ared%7C51.447122963145375%2C0.219824966043234&path=color%3Ared%7C51.43545099534094%2C0.215885974466801%7C51.43643201328814%2C0.215778015553951%7C51.437261989340186%2C0.21575496532023%7C51.43843000754714%2C0.215554973110557%7C51.439601965248585%2C0.215369984507561%7C51.44060201011598%2C0.215344000607729%7C51.441553020849824%2C0.21562403999269%7C51.44237503409386%2C0.216153021901846%7C51.442651972174644%2C0.215806011110544%7C51.44314097240567%2C0.215977001935244%7C51.44331003539264%2C0.216082027181983%7C51.44289697520435%2C0.215830989181995%7C51.442713998258114%2C0.215020962059498%7C51.442868979647756%2C0.213899966329336%7C51.44309596158564%2C0.212731026113033%7C51.443426962941885%2C0.212350990623236%7C51.4441479742527%2C0.212484011426568%7C51.44480997696519%2C0.212583001703024%7C51.445189006626606%2C0.212241020053625%7C51.445404002442956%2C0.212635975331068%7C51.44596399739385%2C0.212837979197502%7C51.446196008473635%2C0.212900005280972%7C51.446842001751065%2C0.213393028825521%7C51.44691500812769%2C0.21407900378108%7C51.44680202007294%2C0.215108972042799%7C51.44667503423989%2C0.216491986066103%7C51.44665298983455%2C0.217388011515141%7C51.44631402567029%2C0.219382988288999%7C51.44664100371301%2C0.220019007101655%7C51.447122963145375%2C0.219824966043234&zoom=14&scale=2&size=278x200&maptype=terrain&key=AIzaSyB4du1SngujDMVsO91yl14Q5rzmQp7eytM">

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
  wp_enqueue_script('pnp-livemap', plugins_url() . '/pnp-livemap/js/script.js', array(), '1.0.0', true);
}

add_action('wp_enqueue_scripts', 'pnp_enqueue_head');

?>