<?php
/**
 * Plugin Name: Sponsor Morning Chalk Up
 * Description: This plugin manages the sponsorship process for MCU
 * Plugin URI: https://github.com/MorningChalkUp/mcu-sponsorship-processing
 * Version: 0.8
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
    $total = $_REQUEST['total'];
    $paid = $_REQUEST['paid'];
    $email = $_REQUEST['email'];
    $name = $_REQUEST['name'];

    $args = array(
      'post_author' => $user->ID,
      'post_title' => $user->user_login . ' Purchase',
      'post_type' => 'purchase',
      'post_status' => 'publish',
    );

    // Purchase
    $purchase = wp_insert_post( $args );

    $title = array(
      'ID' => $purchase,
      'post_title' => $user->user_login . ' Purchase: ' . $purchase,
    );

    wp_update_post( $title );

    update_field( 'purchase_total', $total, $purchase );
    update_field( 'amount_paid', $paid, $purchase );
    update_field( 'purchaser', $user, $purchase );
    update_field( 'stripe_id', $token, $purchase );

    // Item
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

      if( isset( $item['facebook'] ) && $item['facebook'] == 'true' ) {
        update_field( 'facebook_retargeting', true, $item_post );
      }
      if( isset( $item['ab'] ) && $item['ab'] == 'true' ) {
        update_field( 'ab_testing', true, $item_post );
      }
      if( isset( $item['wewrite'] ) && $item['wewrite'] == 'true' ) {
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

      if( have_rows( 'weeks', 'options' ) ) {

        while( have_rows( 'weeks', 'options' ) ) {

          the_row();

          $row_start = get_sub_field( 'start' );

          if( strtotime( $row_start ) ==  strtotime( $item['start'] ) ) {
            update_sub_field( 'availability', 'purchased' );
            update_sub_field( 'purchaser', $user );
          }
        }
      }
    }

    if (!filter_var($name, FILTER_VALIDATE_EMAIL)) {
      $receipt_name = $name;
    } else {
      $receipt_name = $user->display_name;
    }

    $data = array(
      'items' => $_REQUEST['cart']['items'],
      'user' => array(
        'email' => $email,
        'name' => $receipt_name,
      ),
      'transaction' => $purchase,
      'total' => $total,
      'paid' => $paid,
    );

    // var_dump($data);

    $url = 'http://data.morningchalkup.com/api/ads/receipt';

    // $r = wp_remote_post( $url, array( 'body' => $data ) );

    $query = http_build_query($data);

    $ch = curl_init();

    curl_setopt($ch,CURLOPT_URL, $url);
    curl_setopt($ch,CURLOPT_POST, count($data));
    curl_setopt($ch,CURLOPT_POSTFIELDS, $query);

    curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);

    $result = curl_exec($ch);

    var_dump($result);

    // var_dump($r);
  }

  die();
}
