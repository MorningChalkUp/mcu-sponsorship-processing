(function($){

  var handler = StripeCheckout.configure({
    key: $('#balanceBtn').data('key'),
    image: window.location.origin + '/wp-content/themes/mcu-analytics-theme/resources/images/square-blue.png',
    locale: 'auto',
    token: function(token) {
      if(token.id !== null) {
        $.ajax({
          url: '/wp-admin/admin-ajax.php',
          data: {
            action: 'smcu_sponsorship_balance',
            token: token.id,
            total: total,
            paid: paid,
            purchase: purchase,
            email: token.email,
            name: token.card.name,
          },
        }).done(function(msg) {
          res = JSON.parse(msg);
          if (res.network_status != 'approved_by_network') {
            window.location.href = '?r=f&msg=' + res.reason;
          } else {
            window.location.href = '?r=s';
          }
        });
      }
    }
  });

  $('#balanceBtn').on('click', function(e) {
    total = $(this).data('total');
    paid = $(this).data('balance');
    purchase = $(this).data('purchase');
    handler.open({
      name: 'Morning Chalk Up Ads',
      description: 'Pay Your Balance',
      amount: $(this).data('balance') * 100,
      email: $(this).data('user'),
    });
    e.preventDefault();
  });

  window.addEventListener('popstate', function() {
    handler.close();
  });

})(jQuery);