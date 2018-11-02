var max_weeks = 5; // max weeks to buy at one time
var discount_percentage = .2; // as decimal
var discount_weeks = 3; // when discount is granted
var down_payment = .2; //as decimal

var cart;

(function($){
  var week_ids = [];
  $.each($('.purchase-checkbox'), function(i, val) {
    week_ids.push($(val).data('id'));
  });

  $('.purchase-checkbox').change(function() {
    if ($(this).prop('checked') && $('.cart-item').length < max_weeks) {
      html = `
        <div class="cart-item ${$(this).data('id')}" data-price="${$(this).data('price')}" data-item_total="${$(this).data('price')}" data-id="${$(this).data('id')}">
          <h4>${$(this).data('range')} <span class="price">$${$(this).data('price')}</span></h4>
          <div class="inside">
            <p>${$(this).data('notes')}</p>
            <h5>Add-ons:</h5>
            <ul class="add-ons">
              <li><input type="checkbox" data-id="${$(this).data('id')}" class="facebook" data-price="250" id="facebook-${$(this).data('id')}"/> <label for="facebook-${$(this).data('id')}">Facebook Retargeting</label> <span class="price">+ $250</span></li>
              <li><input type="checkbox" data-id="${$(this).data('id')}" class="ab" data-price="250" id="ab-${$(this).data('id')}"/> <label for="ab-${$(this).data('id')}">A/B Testing</label> <span class="price">+ $250</span></li>
              <li><input type="checkbox" data-id="${$(this).data('id')}" class="wewrite" data-price="250" id="wewrite-${$(this).data('id')}"/> <label for="wewrite-${$(this).data('id')}">We Write Your Ads</label> <span class="price">+ $250</span></li>
            </ul>
          </div>
        </div>`
      $('#cart #list').append(html);
      
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') + $(this).data('price'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('#depositButton').data('total', $('#checkoutButton').data('total') * .2);

      if (week_ids.indexOf($(this).data('id')) != 0) {
        prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 1];
        $('#' + prev_id).prop('disabled', true);
      }

      if (week_ids.indexOf($(this).data('id')) != (week_ids.length - 1)) {
        next_id = week_ids[week_ids.indexOf($(this).data('id')) + 1];
        $('#' + next_id).prop('disabled', true);
      }

      if ($('.cart-item').length == discount_weeks) {
        $.each($('.cart-item'), function(i, val) {
          classes = $(val)[0]['className'];
          class_array = classes.split(' ');
          id = class_array[1];
          item = $(`.${id}`);

          discount_price = item.data('price') * (1 - discount_percentage);
          discount = item.data('price') * discount_percentage;

          $(`.${id} h4 .price`).text(`$${discount_price}`);
          item.data('item_total', item.data('item_total') - discount);

          $('#checkoutButton').data('total', $('#checkoutButton').data('total') - discount);
          $('.total #amt').text($('#checkoutButton').data('total'));
          $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);
        });
      } else if ($('.cart-item').length > discount_weeks) {
        id = $(this).data('id');
        item = $(`.${id}`);

        discount_price = item.data('price') * (1 - discount_percentage);
        discount = item.data('price') * discount_percentage;

        $(`.${id} h4 .price`).text(`$${discount_price}`);
        item.data('item_total', item.data('item_total') - discount);
        
        $('#checkoutButton').data('total', $('#checkoutButton').data('total') - discount);
        $('.total #amt').text($('#checkoutButton').data('total'));
        $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);
      }
      if ($('.cart-item').length == max_weeks) {
        $.each($('.purchase-checkbox'), function(i, val) {
          if(!$(val).prop('checked')) {
            $(val).prop('disabled', true);
          }
        });
      }
    } else if (!$(this).prop('checked')) {
      remove_id = $(this).data('id');
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') - $('.'+remove_id).data('item_total'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);
      $('.'+remove_id).remove();

      if (week_ids.indexOf($(this).data('id')) != 0) {
        prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 1];
        if ($('#' + prev_id).data('status') == 'available') {
          if(week_ids.indexOf($(this).data('id')) - 2 >= 0) {
            second_prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 2];
            if (!$('#' + second_prev_id).prop('checked')) {
              $('#' + prev_id).prop('disabled', false);
            }
          } else {
            $('#' + prev_id).prop('disabled', false);
          }
        }
      }

      if (week_ids.indexOf($(this).data('id')) != (week_ids.length - 1)) {
        next_id = week_ids[week_ids.indexOf($(this).data('id')) + 1];
        if ($('#' + next_id).data('status') == 'available') {
          if(week_ids.indexOf($(this).data('id')) + 2 < week_ids.length) {
            second_next_id = week_ids[week_ids.indexOf($(this).data('id')) + 2];
            if (!$('#' + second_next_id).prop('checked')) {
              $('#' + next_id).prop('disabled', false);
            }
          } else {
            $('#' + next_id).prop('disabled', false);
          }
        }
      }

      if ($('.cart-item').length < discount_weeks) {
        $.each($('.cart-item'), function(i, val) {
          classes = $(val)[0]['className'];
          class_array = classes.split(' ');
          id = class_array[1];
          item = $(`.${id}`);

          discount_price = item.data('price') * (1 - discount_percentage);
          discount = item.data('price') * discount_percentage;

          $(`.${id} h4 .price`).text(`$${item.data('price')}`);
          item.data('item_total', item.data('item_total') + discount);

          $('#checkoutButton').data('total', $('#checkoutButton').data('total') + discount);
          $('.total #amt').text($('#checkoutButton').data('total'));
          $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);
        });
      }
      if ($('.cart-item').length == max_weeks - 1) {
        $.each(week_ids, function(i, val) {
          if(!$('#'+val).prop('checked')) {
            if($('#'+val).data('status') == 'available') {
              if(((i - 1) >= 0 && !$('#' + week_ids[i - 1]).prop('checked')) && (i < week_ids.length && !$('#' + week_ids[i + 1]).prop('checked'))) {
                $('#'+val).prop('disabled', false);
              }
            }
          }
        });
      }
    }
    updateCart();
  });

  $(document).on('change', '.add-ons input', function(event) {
    if($(this).prop('checked')) {
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') + $(this).data('price'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('.'+$(this).data('id')).data('item_total', $('.'+$(this).data('id')).data('item_total') + $(this).data('price'));
    } else {
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') - $(this).data('price'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('.'+$(this).data('id')).data('item_total', $('.'+$(this).data('id')).data('item_total') - $(this).data('price'));
    }
    updateCart();
  });

  var handler = StripeCheckout.configure({
    key: 'pk_test_Ei950K9xue0tIKAgJL60Mh31',
    image: window.location.origin + '/wp-content/themes/mcu-analytics-theme/resources/images/square-blue.png',
    locale: 'auto',
    token: function(token) {
      if(token.id != null) {
        $.ajax({
          url: '/wp-admin/admin-ajax.php',
          data: {
            action: 'smcu_sponsorship_purchase',
            token: token.id,
            cart: cart,
          },
        }).done(function(msg) {
          window.location.href = '/?msg=success';
        });
      }
    }
  });

  $('#checkoutButton').on('click', function(e) {
    handler.open({
      name: 'MCU Sponsorship',
      description: 'Full Price',
      amount: $(this).data('total') * 100,
    });
    e.preventDefault();
  });

  $('#depositButton').on('click', function(e) {
    handler.open({
      name: 'MCU Sponsorship',
      description: 'Deposit',
      amount: $(this).data('total') * 100,
    });
    e.preventDefault();
  });

  window.addEventListener('popstate', function() {
    handler.close();
  });

  function updateCart() {
    cart = {items: []};
    $.each($('.cart-item'), function(i,val) {
      id = $(val).data('id');

      item = {
        id: id,
        start: $('#'+id).data('start'),
        end: $('#'+id).data('end'),
        facebook: $('.'+id+' .facebook').prop('checked'),
        ab: $('.'+id+' .ab').prop('checked'),
        wewrite: $('.'+id+' .wewrite').prop('checked'),
      };

      cart.items.push(item);
    });
  }
})(jQuery);