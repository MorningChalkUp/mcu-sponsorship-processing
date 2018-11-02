<?php
/**
 * Plugin Name: Sponsor Morning Chalk Up
 * Description: This plugin manages the sponsorship process for MCU
 * Version: 1.0.0
 * Author: Eric Sherred
 * Author URI: https://ericsherred.com
 * License: GPL3
 */

add_action( 'wp_enqueue_scripts', 'smcu_enqueue_scripts' );
function smcu_enqueue_scripts() {
  if ( is_page_template( 'templates/page-sponsor.php' ) ) {
    wp_enqueue_script( 'stripe-checkout', 'https://checkout.stripe.com/checkout.js', null, null, true );
    wp_enqueue_script( 'sponsor-mcu',  plugins_url( 'js/sponsor-mcu.js', __FILE__ ), array('jquery', 'stripe-checkout'), null, true );
  }
}

add_action( 'wp_ajax_smcu_sponsorship_purchase', 'smcu_sponsorship_purchase' );
function smcu_sponsorship_purchase() {
  if ( isset( $_REQUEST ) ) {

    $token = $_REQUEST['token'];
    $cart = $_REQUEST['cart']['items'];
    $user = get_userdata( get_current_user_id() );

    $args = array(
      'post_author' => $user->ID,
      'post_title' => $user->user_login . ' Purchase',
      'post_type' => 'purchase',
      'post_status' => 'publish',
    );

    $purchase = wp_insert_post( $args );

    $title = array(
      'ID' => $purchase,
      'post_title' => $user->user_login . ' Purchase: ' . $purchase,
    );

    wp_update_post( $title );

    update_field( 'purchase_total', 2100, $purchase );
    update_field( 'amount_paid', 200, $purchase );
    update_field( 'purchaser', $user, $purchase );
    update_field( 'stripe_id', $token, $purchase );

    foreach ( $cart as $item ) {
      $args = array(
        'post_author' => $user->ID,
        'post_title' => $item['start'] . ' - ' . $item['end'],
        'post_type' => 'purchased_item',
        'post_status' => 'publish',
      );

      $item_post = wp_insert_post( $args );

      update_field( 'purchaser', $user, $item_post );
      update_field( 'purchase_id', $purchase, $item_post );
      update_field( 'start', $item['start'], $item_post );
      update_field( 'end', $item['end'], $item_post );

      if( $item['facebook'] == 'true' ) {
        update_field( 'facebook_retargeting', true, $item_post );
      }
      if( $item['ab'] == 'true' ) {
        update_field( 'ab_testing', true, $item_post );
      }
      if( $item['wewrite'] == 'true' ) {
        update_field( 'we_write_ads', true, $item_post );
      }

      $curr = $item['start'];
      $end = $item['end'];
      $stop = false;

      do {

        $row = array(
          'date' => $curr,
        );

        $i = add_row( 'days', $row, $item_post );

        if ($curr == $end) {
          $stop = true;
        } else {
          $curr = date('n/j/Y', strtotime("+1 day", strtotime($curr)));
        }

      } while (!$stop);
    }
  }

  die();
}
