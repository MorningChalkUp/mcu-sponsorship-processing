<?php
/**
 * Plugin Name: Sponsor Morning Chalk Up
 * Description: This plugin manages the sponsorship process for MCU
 * Plugin URI: https://github.com/MorningChalkUp/mcu-sponsorship-processing
 * Version: 1.0
 * Author: Eric Sherred
 * Author URI: https://ericsherred.com
 * License: GPL3
 */

require_once('stripe/init.php');

add_action( 'wp_enqueue_scripts', 'smcu_enqueue_scripts' );
function smcu_enqueue_scripts() {
  if ( is_page_template( 'templates/page-sponsor.php' ) ) {
    wp_enqueue_script( 'stripe-checkout', 'https://checkout.stripe.com/checkout.js', null, null, true );
    wp_enqueue_script( 'sponsor-mcu',  plugins_url( 'js/sponsor-mcu.js', __FILE__ ), array('jquery', 'stripe-checkout'), null, true );
  } else if ( is_page_template( 'templates/page-sponsored-links.php' ) ) {
    wp_enqueue_script( 'stripe-checkout', 'https://checkout.stripe.com/checkout.js', null, null, true );
    wp_enqueue_script( 'sponsor-mcu',  plugins_url( 'js/sponsored-links-mcu.js', __FILE__ ), array('jquery', 'stripe-checkout'), null, true );
  }
  if ( is_singular( array( 'purchased_item', 'purchase' ) ) ) {
    wp_enqueue_script( 'stripe-checkout', 'https://checkout.stripe.com/checkout.js', null, null, true );
    wp_enqueue_script( 'balance-mcu',  plugins_url( 'js/balance-mcu.js', __FILE__ ), array('jquery', 'stripe-checkout'), null, true );
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

    foreach ( $cart as $item ) {
      if( have_rows( 'weeks', 'options' ) ) {
        while( have_rows( 'weeks', 'options' ) ) {
          the_row();
          $row_start = get_sub_field( 'start' );
          if( strtotime( $row_start ) ==  strtotime( $item['start'] ) ) {
            if(get_sub_field('availability') != 'available') {
              echo json_encode(array('error' => 'One or more dates are now unavailable'));
              exit;
            }
          }
        }
      }
    }


    if( get_field( 'mode', 'options') == 'test' ) {
      $secret = get_field( 'stripe_test_secret_key', 'options' );
    } elseif ( get_field( 'mode', 'options') == 'live' ) {
      $secret = get_field( 'stripe_live_secret_key', 'options' );
    } else {
      echo 'No Key Found';
      die();
    }

    \Stripe\Stripe::setApiKey($secret);

    $charge = \Stripe\Charge::create([
        'amount' => ($paid * 100),
        'currency' => 'usd',
        'description' => 'Mornign Chalk Up ',
        'source' => $token,
    ]);

    echo json_encode($charge->outcome);

    if($charge->outcome->network_status != 'approved_by_network') {
      exit;
    } else {
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
      update_field( 'stripe_id', $charge->id, $purchase );

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

      $url = 'http://data.morningchalkup.com/api/ads/receipt';

      $query = http_build_query($data);

      $ch = curl_init();

      curl_setopt($ch,CURLOPT_URL, $url);
      curl_setopt($ch,CURLOPT_POST, count($data));
      curl_setopt($ch,CURLOPT_POSTFIELDS, $query);

      curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);

      $result = curl_exec($ch);
    }
  }

  die();
}

add_action( 'wp_ajax_smcu_link_sponsorship_purchase', 'smcu_link_sponsorship_purchase' );
function smcu_link_sponsorship_purchase() {
  if ( isset( $_REQUEST ) ) {

    $token = $_REQUEST['token'];
    $cart = $_REQUEST['cart']['items'];
    $user = get_userdata( get_current_user_id() );
    $total = $_REQUEST['total'];
    $paid = $_REQUEST['paid'];
    $email = $_REQUEST['email'];
    $name = $_REQUEST['name'];

    foreach ( $cart as $item ) {
      if( have_rows( 'links', 'options' ) ) {
        while( have_rows( 'links', 'options' ) ) {
          the_row();
          $row_start = get_sub_field( 'day' );
          if( strtotime( $row_start ) ==  strtotime( $item['start'] ) ) {
            if(get_sub_field('availability') != 'available') {
              echo json_encode(array('error' => 'One or more dates are now unavailable'));
              exit;
            }
          }
        }
      }
    }


    if( get_field( 'mode', 'options') == 'test' ) {
      $secret = get_field( 'stripe_test_secret_key', 'options' );
    } elseif ( get_field( 'mode', 'options') == 'live' ) {
      $secret = get_field( 'stripe_live_secret_key', 'options' );
    } else {
      echo 'No Payment Key Found';
      die();
    }

    \Stripe\Stripe::setApiKey($secret);

    $charge = \Stripe\Charge::create([
        'amount' => ($paid * 100),
        'currency' => 'usd',
        'description' => 'Mornign Chalk Up ',
        'source' => $token,
    ]);

    echo json_encode($charge->outcome);

    if($charge->outcome->network_status != 'approved_by_network') {
      exit;
    } else {
      $args = array(
        'post_author' => $user->ID,
        'post_title' => $user->user_login . ' Sponsored Link Purchase',
        'post_type' => 'purchase',
        'post_status' => 'publish',
      );

      // Purchase
      $purchase = wp_insert_post( $args );

      $title = array(
        'ID' => $purchase,
        'post_title' => $user->user_login . ' Sponsored Link Purchase: ' . $purchase,
      );

      wp_update_post( $title );

      update_field( 'purchase_total', $total, $purchase );
      update_field( 'amount_paid', $paid, $purchase );
      update_field( 'purchaser', $user, $purchase );
      update_field( 'stripe_id', $charge->id, $purchase );

      // Item
      foreach ( $cart as $item ) {
        if( have_rows( 'links', 'options' ) ) {

          while( have_rows( 'links', 'options' ) ) {

            the_row();

            $row_start = get_sub_field( 'day' );

            if( strtotime( $row_start ) ==  strtotime( $item['start'] ) ) {
              update_sub_field( 'availability', 'purchased' );
              update_sub_field( 'purchaser', $user );
              update_sub_field( 'order_id', $purchase );
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

      $data['send_admin'] = false;

      $url = 'http://data.morningchalkup.com/api/ads/receipt';

      $query = http_build_query($data);

      $ch = curl_init();

      curl_setopt($ch,CURLOPT_URL, $url);
      curl_setopt($ch,CURLOPT_POST, count($data));
      curl_setopt($ch,CURLOPT_POSTFIELDS, $query);

      curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);

      $result = curl_exec($ch);
    }
  }

  die();
}

add_action( 'wp_ajax_smcu_sponsorship_balance', 'smcu_sponsorship_balance' );
function smcu_sponsorship_balance() {
  if ( isset( $_REQUEST ) ) {
    $token = $_REQUEST['token'];
    $user = get_userdata( get_current_user_id() );
    $total = $_REQUEST['total'];
    $paid = $_REQUEST['paid'];
    $email = $_REQUEST['email'];
    $name = $_REQUEST['name'];
    $purchase = $_REQUEST['purchase'];

    if( get_field( 'mode', 'options') == 'test' ) {
      $secret = get_field( 'stripe_test_secret_key', 'options' );
    } elseif ( get_field( 'mode', 'options') == 'live' ) {
      $secret = get_field( 'stripe_live_secret_key', 'options' );
    } else {
      echo 'No Key Found';
      die();
    }

    \Stripe\Stripe::setApiKey($secret);

    $charge = \Stripe\Charge::create([
      'amount' => ($paid * 100),
      'currency' => 'usd',
      'description' => 'Mornign Chalk Up ',
      'source' => $token,
    ]);
    
    echo json_encode($charge->outcome);

    if($charge->outcome->network_status != 'approved_by_network') {
      exit;
    } else {
      $updated_total = $paid + get_field('amount_paid', $purchase);

      update_field( 'amount_paid', $updated_total, $purchase );

      $weeks = query_posts(array(
        'post_type' => 'purchased_item',
        'posts_per_page' => -1,
        'meta_key' => 'purchase_id',
        'meta_value' => $purchase,
        'orderby' => 'title',
        'order' => 'ASC',
      ));

      foreach ($weeks as $key => $week) {
        $items[$key]['facebook'] = get_field('facebook_retargeting', $week) ? 'true' : 'false';
        $items[$key]['ab'] = get_field('ab_testing', $week) ? 'true' : 'false';
        $items[$key]['wewrite'] = get_field('we_write_ads', $week) ? 'true' : 'false';
        $items[$key]['start'] = date('F j', strtotime(get_field('start', $week)));
        $items[$key]['end'] = date('F j', strtotime(get_field('end', $week)));
      }

      if (!filter_var($name, FILTER_VALIDATE_EMAIL)) {
        $receipt_name = $name;
      } else {
        $receipt_name = $user->display_name;
      }

      $data = array(
        'items' => $items,
        'user' => array(
          'email' => $email,
          'name' => $receipt_name,
        ),
        'transaction' => $purchase,
        'total' => $total,
        'paid' => $updated_total,
        'send_admin' => false,
      );

      $url = 'http://data.morningchalkup.com/api/ads/receipt';

      $query = http_build_query($data);

      $ch = curl_init();

      curl_setopt($ch,CURLOPT_URL, $url);
      curl_setopt($ch,CURLOPT_POST, count($data));
      curl_setopt($ch,CURLOPT_POSTFIELDS, $query);
      curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);

      $result = curl_exec($ch);

    }

  }
  exit;
}