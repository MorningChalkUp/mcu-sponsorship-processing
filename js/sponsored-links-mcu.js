var max_weeks = 20; // max weeks to buy at one time
var down_payment = 0.2; //as decimal

var cart = { items: [] };
var total = 0;
var paid = 0;
var link_ids = [];
var purchsed_link_ids = [];
var purchased_link_count = 0;

(function($) {

    var public = $('#cart').data('key');

    $.each($('.purchase-checkbox'), function(i, val) {
        link_ids.push($(val).data('id'));
        if ($(val).hasClass('purchaser')) {
            purchsed_link_ids.push($(val).data('id'));
            ++purchased_link_count;
        }
        $('.purchase-checkbox').prop('checked', false);
    });

    if (purchased_link_count >= max_weeks) {
        $.each($('.purchase-checkbox'), function(i, val) {
            $(val).prop('disabled', true);
        });
    } else {
        $.each(purchsed_link_ids, function(i, val) {
            if (link_ids.indexOf($('#' + val).data('id')) !== 0) {
                prev_id = link_ids[link_ids.indexOf($('#' + val).data('id')) - 1];
                $('#' + prev_id).prop('disabled', true);
            }

            if (link_ids.indexOf($('#' + val).data('id')) !== (link_ids.length - 1)) {
                next_id = link_ids[link_ids.indexOf($('#' + val).data('id')) + 1];
                $('#' + next_id).prop('disabled', true);
            }
        });
    }

    $('.purchase-checkbox').change(function() {
        if ($(this).prop('checked')) {
            if ($(this).next('label').hasClass('single-day')) {
                single = 'single-day';
            } else {
                single = '';
            }

            html = `<div class="cart-item ${$(this).data('id')} ${single}" data-price="${$(this).data('price')}" data-item_total="${$(this).data('price')}" data-id="${$(this).data('id')}">
        <h4>${$(this).data('range')} <span class="price">$${$(this).data('price')}</span></h4>
        <div class="inside">
          <p>${$(this).data('notes')}</p>`;


            html += `</div>
      </div>`;

            if ($('.cart-item').length == 0 && $('#checkout').css('opacity') == 0) {
                $('#checkout').css('opacity', 1);
            }
            $('#cart #list').append(html);

            $('#checkoutButton').data('total', $('#checkoutButton').data('total') + $(this).data('price'));
            $('.total #amt').text($('#checkoutButton').data('total'));
            $('#depositButton').data('total', $('#checkoutButton').data('total') * .2);

            // if (!$(this).next('label').hasClass('single-day')) {
            if (link_ids.indexOf($(this).data('id')) !== 0) {
                prev_id = link_ids[link_ids.indexOf($(this).data('id')) - 1];
                $('#' + prev_id).prop('disabled', true);
            }

            if (link_ids.indexOf($(this).data('id')) !== (link_ids.length - 1)) {
                next_id = link_ids[link_ids.indexOf($(this).data('id')) + 1];
                $('#' + next_id).prop('disabled', true);
            }
            // }

            if (($('.cart-item').length) == (max_weeks - purchased_link_count)) {
                $.each($('.purchase-checkbox'), function(i, val) {
                    if (!$(val).prop('checked')) {
                        $(val).prop('disabled', true);
                    }
                });
            }
        } else if (!$(this).prop('checked')) {
            remove_id = $(this).data('id');
            $('#checkoutButton').data('total', $('#checkoutButton').data('total') - $('.' + remove_id).data('item_total'));
            $('.total #amt').text($('#checkoutButton').data('total'));
            $('#depositButton').data('total', $('#checkoutButton').data('total') * down_payment);

            if ($('.cart-item').length == 1) {
                $('#checkout').css('opacity', 0);
            }
            $('.' + remove_id).fadeTo(200, 0, function() {
                $('.' + remove_id).remove();
            });

            if (link_ids.indexOf($(this).data('id')) !== 0) {
                prev_id = link_ids[link_ids.indexOf($(this).data('id')) - 1];
                if ($('#' + prev_id).data('status') == 'available') {
                    if (link_ids.indexOf($(this).data('id')) - 2 >= 0) {
                        second_prev_id = link_ids[link_ids.indexOf($(this).data('id')) - 2];
                        if (!$('#' + second_prev_id).prop('checked') && !$('#' + second_prev_id).hasClass('purchaser')) {
                            $('#' + prev_id).prop('disabled', false);
                        }
                    } else {
                        $('#' + prev_id).prop('disabled', false);
                    }
                }
            }

            if (link_ids.indexOf($(this).data('id')) !== (link_ids.length - 1)) {
                next_id = link_ids[link_ids.indexOf($(this).data('id')) + 1];
                if ($('#' + next_id).data('status') == 'available') {
                    if (link_ids.indexOf($(this).data('id')) + 2 < link_ids.length) {
                        second_next_id = link_ids[link_ids.indexOf($(this).data('id')) + 2];
                        if (!$('#' + second_next_id).prop('checked') && !$('#' + second_next_id).hasClass('purchaser')) {
                            $('#' + next_id).prop('disabled', false);
                        }
                    } else {
                        $('#' + next_id).prop('disabled', false);
                    }
                }
            }

            if (($('.cart-item').length) == (max_weeks - purchased_link_count)) {
                $.each(link_ids, function(i, val) {
                    if (!$('#' + val).prop('checked')) {
                        if ($('#' + val).data('status') == 'available') {
                            if ((i == 0 && !$('#' + link_ids[i + 1]).prop('checked') && !$('#' + link_ids[i + 1]).hasClass('purchaser')) || ((i - 1) >= 0 && !$('#' + link_ids[i - 1]).prop('checked') && !$('#' + link_ids[i - 1]).hasClass('purchaser')) && (i < link_ids.length && !$('#' + link_ids[i + 1]).prop('checked') && !$('#' + link_ids[i + 1]).hasClass('purchaser'))) {
                                $('#' + val).prop('disabled', false);
                            }
                        }
                    }
                });
            }
        }
        updateCart();
    });

    $(document).on('change', '.add-ons input', function(event) {
        if ($(this).prop('checked')) {
            $('#checkoutButton').data('total', $('#checkoutButton').data('total') + $(this).data('price'));
            $('.total #amt').text($('#checkoutButton').data('total'));
            $('.' + $(this).data('id')).data('item_total', $('.' + $(this).data('id')).data('item_total') + $(this).data('price'));
        } else {
            $('#checkoutButton').data('total', $('#checkoutButton').data('total') - $(this).data('price'));
            $('.total #amt').text($('#checkoutButton').data('total'));
            $('.' + $(this).data('id')).data('item_total', $('.' + $(this).data('id')).data('item_total') - $(this).data('price'));
        }
        updateCart();
    });

    var handler = StripeCheckout.configure({
        key: public,
        image: window.location.origin + '/wp-content/themes/mcu-analytics-theme/resources/images/square-blue.png',
        locale: 'auto',
        token: function(token) {
            if (token.id !== null) {
                $.ajax({
                    url: '/wp-admin/admin-ajax.php',
                    data: {
                        action: 'smcu_link_sponsorship_purchase',
                        token: token.id,
                        cart: cart,
                        total: total,
                        paid: paid,
                        email: token.email,
                        name: token.card.name,
                    },
                }).done(function(msg) {
                    res = JSON.parse(msg);
                    if (res.error) {
                        window.location.href = '?r=f&msg=' + res.error;
                    } else if (res.network_status != 'approved_by_network') {
                        window.location.href = '?r=f&msg=' + res.reason;
                    } else {
                        window.location.href = '/?r=s';
                    }
                });
            }
        }
    });

    $('#checkoutButton').on('click', function(e) {
        total = $(this).data('total');
        paid = $(this).data('total');
        console.log(cart);
        handler.open({
            name: 'Morning Chalk Up Ads',
            description: 'Pay in Full',
            amount: $(this).data('total') * 100,
            email: $('#cart').data('user'),
        });
        e.preventDefault();
    });

    window.addEventListener('popstate', function() {
        handler.close();
    });

    function updateCart() {
        cart = { items: [] };
        $.each($('.purchase-checkbox:checked'), function(i, val) {
            id = $(val).data('id');

            item = {
                id: id,
                start: $('#' + id).data('start'),
                end: $('#' + id).data('end'),
                cost: $('.' + id).data('item_total'),
            };

            cart.items.push(item);
        });
    }
})(jQuery);