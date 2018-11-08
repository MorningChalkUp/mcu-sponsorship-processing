var max_weeks = 8; // max weeks to buy at one time
var down_payment = 0.2; //as decimal

var cart = {items: []};
var total = 0;
var paid = 0;
var week_ids = [];
var day_ids = [];
var purchsed_week_ids = [];
var purchsed_day_ids = [];
var purchased_week_count = 0;
var purchased_day_count = 0;

(function($){

  var public = $('#cart').data('key');

  $.each($('.purchase-checkbox'), function(i, val) {
    if($(val).next('label').hasClass('single-day')) {
      day_ids.push($(val).data('id'));
      if($(val).hasClass('purchaser')) {
        purchsed_day_ids.push($(val).data('id'));
        ++purchased_day_count;
      }
    } else {
      week_ids.push($(val).data('id'));
      if($(val).hasClass('purchaser')) {
        purchsed_week_ids.push($(val).data('id'));
        ++purchased_week_count;
      }
    }
    $('.purchase-checkbox').prop('checked', false);
  });

  if (purchased_week_count >= max_weeks) {
    $.each($('.purchase-checkbox'), function(i, val) {
      if(!$(val).next('label').hasClass('single-day')) {
        $(val).prop('disabled', true);
      }
    });
  } else {
    $.each(purchsed_week_ids, function(i, val) {
      if(!$('#'+val).next('label').hasClass('single-day')) {
        if (week_ids.indexOf($('#'+val).data('id')) !== 0) {
          prev_id = week_ids[week_ids.indexOf($('#'+val).data('id')) - 1];
          $('#' + prev_id).prop('disabled', true);
        }

        if (week_ids.indexOf($('#'+val).data('id')) !== (week_ids.length - 1)) {
          next_id = week_ids[week_ids.indexOf($('#'+val).data('id')) + 1];
          $('#' + next_id).prop('disabled', true);
        }
      }
    });
  }

  $('.purchase-checkbox').change(function() {
    if ($(this).prop('checked')) {
      if($(this).next('label').hasClass('single-day')) {
        single = 'single-day';
      } else {
        single = '';
      }

      html = `<div class="cart-item ${$(this).data('id')} ${single}" data-price="${$(this).data('price')}" data-item_total="${$(this).data('price')}" data-id="${$(this).data('id')}">
        <h4>${$(this).data('range')} <span class="price">$${$(this).data('price')}</span></h4>
        <div class="inside">
          <p>${$(this).data('notes')}</p>`;

          if($(this).data('facebook') != 'false' || $(this).data('ab') != 'false' || $(this).data('wewrite') != 'false') {

            html += `<h5>Add-ons:</h5>
              <ul class="add-ons">`;

            if($(this).data('facebook')) {
              html += `<li><input type="checkbox" data-id="${$(this).data('id')}" class="facebook" data-price="175" id="facebook-${$(this).data('id')}"/> <label for="facebook-${$(this).data('id')}">Facebook Retargeting</label> <span class="price">+ $175</span></li>`;
            }

            if($(this).data('ab')) {
              if(single == 'single-day') {
                html += `<li data-tooltip="A/B Testing: Put your ad copy to the test and see which one performs the best."><input type="checkbox" data-id="${$(this).data('id')}" class="ab" data-price="125" id="ab-${$(this).data('id')}"/> <label for="ab-${$(this).data('id')}">A/B Testing</label> <span class="price">+ $125</span></li>`;
              } else {
                html += `<li data-tooltip="A/B Testing: Put your ad copy to the test and see which one performs the best."><input type="checkbox" data-id="${$(this).data('id')}" class="ab" data-price="250" id="ab-${$(this).data('id')}"/> <label for="ab-${$(this).data('id')}">A/B Testing</label> <span class="price">+ $250</span></li>`;
              }
            }

            if($(this).data('wewrite')) { 
              html += `<li data-tooltip="We Write Your Ads: Let our team wordsmith your ads for you."><input type="checkbox" data-id="${$(this).data('id')}" class="wewrite" data-price="250" id="wewrite-${$(this).data('id')}"/> <label for="wewrite-${$(this).data('id')}">We Write Your Ads</label> <span class="price">+ $250</span></li>`;
            }
          html += `</ul>`;
          }
          
        html += `</div>
      </div>`;

      if($('.cart-item').length == 0 && $('#checkout').css('opacity') == 0) {
        $('#checkout').css('opacity',1);
      }
      $('#cart #list').append(html);
      
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') + $(this).data('price'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('#depositButton').data('total', $('#checkoutButton').data('total') * .2);

      if(!$(this).next('label').hasClass('single-day')) {
        if (week_ids.indexOf($(this).data('id')) !== 0) {
          prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 1];
          $('#' + prev_id).prop('disabled', true);
        }

        if (week_ids.indexOf($(this).data('id')) !== (week_ids.length - 1)) {
          next_id = week_ids[week_ids.indexOf($(this).data('id')) + 1];
          $('#' + next_id).prop('disabled', true);
        }
      }

      if (($('.cart-item').length - $('.cart-item.single-day').length) == (max_weeks - purchased_week_count) ) {
        $.each($('.purchase-checkbox'), function(i, val) {
          if(!$(val).next('label').hasClass('single-day')) {
            if(!$(val).prop('checked')) {
              $(val).prop('disabled', true);
            }
          }
        });
      }
    } else if (!$(this).prop('checked')) {
      remove_id = $(this).data('id');
      $('#checkoutButton').data('total', $('#checkoutButton').data('total') - $('.'+remove_id).data('item_total'));
      $('.total #amt').text($('#checkoutButton').data('total'));
      $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);

      if($('.cart-item').length == 1) {
        $('#checkout').css('opacity',0);
      }
      $('.'+remove_id).fadeTo(200, 0, function() {
        $('.'+remove_id).remove();
      });

      if (week_ids.indexOf($(this).data('id')) !== 0) {
        prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 1];
        if ($('#' + prev_id).data('status') == 'available') {
          if(week_ids.indexOf($(this).data('id')) - 2 >= 0) {
            second_prev_id = week_ids[week_ids.indexOf($(this).data('id')) - 2];
            if (!$('#' + second_prev_id).prop('checked') && !$('#' + second_prev_id).hasClass('purchaser')) {
              $('#' + prev_id).prop('disabled', false);
            }
          } else {
            $('#' + prev_id).prop('disabled', false);
          }
        }
      }

      if (week_ids.indexOf($(this).data('id')) !== (week_ids.length - 1)) {
        next_id = week_ids[week_ids.indexOf($(this).data('id')) + 1];
        if ($('#' + next_id).data('status') == 'available') {
          if(week_ids.indexOf($(this).data('id')) + 2 < week_ids.length) {
            second_next_id = week_ids[week_ids.indexOf($(this).data('id')) + 2];
            if (!$('#' + second_next_id).prop('checked') && !$('#' + second_next_id).hasClass('purchaser')) {
              $('#' + next_id).prop('disabled', false);
            }
          } else {
            $('#' + next_id).prop('disabled', false);
          }
        }
      }

      if (($('.cart-item').length - $('.cart-item.single-day').length) == (max_weeks - purchased_week_count)) {
        $.each(week_ids, function(i, val) {
          if(!$('#'+val).prop('checked')) {
            if($('#'+val).data('status') == 'available') {
              if((i == 0 && !$('#' + week_ids[i + 1]).prop('checked') && !$('#' + week_ids[i + 1]).hasClass('purchaser')) || ((i - 1) >= 0 && !$('#' + week_ids[i - 1]).prop('checked') && !$('#' + week_ids[i - 1]).hasClass('purchaser')) && (i < week_ids.length && !$('#' + week_ids[i + 1]).prop('checked') && !$('#' + week_ids[i + 1]).hasClass('purchaser'))) {
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
    key: public,
    image: window.location.origin + '/wp-content/themes/mcu-analytics-theme/resources/images/square-blue.png',
    locale: 'auto',
    token: function(token) {
      if(token.id !== null) {
        $.ajax({
          url: '/wp-admin/admin-ajax.php',
          data: {
            action: 'smcu_sponsorship_purchase',
            token: token.id,
            cart: cart,
            total: total,
            paid: paid,
            email: token.email,
            name: token.card.name,
          },
        }).done(function(msg) {
          console.log(msg);
          window.location.href = '/?msg=success';
        });
      }
    }
  });

  $('#checkoutButton').on('click', function(e) {
    total = $(this).data('total');
    paid = $(this).data('total');
    handler.open({
      name: 'Morning Chalk Up Ads',
      description: 'Pay in Full',
      amount: $(this).data('total') * 100,
      email: $('#cart').data('user'),
    });
    e.preventDefault();
  });

  $('#depositButton').on('click', function(e) {
    total = $('#checkoutButton').data('total');
    paid = $(this).data('total');
    handler.open({
      name: 'Morning Chalk Up Ads',
      description: '20% Deposit',
      amount: $(this).data('total') * 100,
      email: $('#cart').data('user'),
    });
    e.preventDefault();
  });

  window.addEventListener('popstate', function() {
    handler.close();
  });

  function updateCart() {
    cart = {items: []};
    $.each($('.purchase-checkbox:checked'), function(i,val) {
      id = $(val).data('id');

      item = {
        id: id,
        start: $('#'+id).data('start'),
        end: $('#'+id).data('end'),
        facebook: $('.'+id+' .facebook').prop('checked'),
        ab: $('.'+id+' .ab').prop('checked'),
        wewrite: $('.'+id+' .wewrite').prop('checked'),
        cost: $('.'+id).data('item_total'),
      };

      cart.items.push(item);
    });
  }
})(jQuery);