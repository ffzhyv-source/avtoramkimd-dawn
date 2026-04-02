(function() {
  'use strict';

  function init() {
    var configEl = document.getElementById('fbConfig');
    if (!configEl) return;
    var cfg;
    try {
      cfg = JSON.parse(configEl.textContent);
    } catch(e) {
      console.error('Frame builder config error', e);
      return;
    }

  // State
  var state = {
    frameColor: '#1a1a1a',
    frameColorName: 'Чёрный',
    textTop: document.getElementById('fbInputTop').value,
    textBottom: document.getElementById('fbInputBottom').value,
    textColor: '#ffffff',
    font: "'Arial', sans-serif",
    plateNumber: 'A 012 BCD',
    qty: 1
  };

  // DOM refs
  var els = {
    frameTop: document.getElementById('fbFrameTop'),
    frameBottom: document.getElementById('fbFrameBottom'),
    textTop: document.getElementById('fbTextTop'),
    textBottom: document.getElementById('fbTextBottom'),
    plateNumber: document.getElementById('fbPlateNumber'),
    colorName: document.getElementById('fbColorName'),
    charTop: document.getElementById('fbCharTop'),
    charBottom: document.getElementById('fbCharBottom'),
    priceDisplay: document.getElementById('fbPriceDisplay'),
    summaryColor: document.getElementById('fbSummaryColor'),
    summaryTop: document.getElementById('fbSummaryTop'),
    summaryBottom: document.getElementById('fbSummaryBottom'),
    summaryPrice: document.getElementById('fbSummaryPrice'),
    qtyInput: document.getElementById('fbQty'),
    addBtn: document.getElementById('fbAddToCart'),
    cartMsg: document.getElementById('fbCartMsg')
  };

  // ---- Render ----
  function render() {
    els.frameTop.style.background = state.frameColor;
    els.frameBottom.style.background = state.frameColor;

    // Plate left/right border matches frame
    var plate = document.querySelector('.fb__plate');
    if (plate) {
      plate.style.borderLeftColor = state.frameColor;
      plate.style.borderRightColor = state.frameColor;
    }

    els.textTop.textContent = state.textTop || '';
    els.textBottom.textContent = state.textBottom || '';
    els.textTop.style.color = state.textColor;
    els.textBottom.style.color = state.textColor;
    els.textTop.style.fontFamily = state.font;
    els.textBottom.style.fontFamily = state.font;
    els.plateNumber.textContent = state.plateNumber || 'A 012 BCD';

    els.colorName.textContent = state.frameColorName;
    els.charTop.textContent = state.textTop.length;
    els.charBottom.textContent = state.textBottom.length;

    // Price calc
    var price = cfg.basePrice;
    if (state.textTop.trim() || state.textBottom.trim()) {
      price += cfg.textPrice;
    }
    var total = price * state.qty;
    var priceStr = total + ' ' + cfg.currency;
    els.priceDisplay.textContent = priceStr;
    els.summaryPrice.textContent = priceStr;

    // Summary
    els.summaryColor.textContent = state.frameColorName;
    els.summaryTop.textContent = state.textTop || '—';
    els.summaryBottom.textContent = state.textBottom || '—';
  }

  // ---- Frame Color ----
  var colorBtns = document.querySelectorAll('#fbColors .fb__color-btn');
  colorBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      colorBtns.forEach(function(b) { b.classList.remove('fb__color-btn--active'); });
      btn.classList.add('fb__color-btn--active');
      state.frameColor = btn.getAttribute('data-color');
      state.frameColorName = btn.getAttribute('data-name');
      render();
    });
  });

  // ---- Text Inputs ----
  document.getElementById('fbInputTop').addEventListener('input', function(e) {
    state.textTop = e.target.value;
    render();
  });
  document.getElementById('fbInputBottom').addEventListener('input', function(e) {
    state.textBottom = e.target.value;
    render();
  });
  document.getElementById('fbInputPlate').addEventListener('input', function(e) {
    state.plateNumber = e.target.value;
    render();
  });

  // ---- Text Color ----
  var tcolorBtns = document.querySelectorAll('#fbTextColors .fb__tcolor-btn');
  tcolorBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      tcolorBtns.forEach(function(b) { b.classList.remove('fb__tcolor-btn--active'); });
      btn.classList.add('fb__tcolor-btn--active');
      state.textColor = btn.getAttribute('data-tcolor');
      render();
    });
  });

  // ---- Fonts ----
  var fontBtns = document.querySelectorAll('#fbFonts .fb__font-btn');
  fontBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      fontBtns.forEach(function(b) { b.classList.remove('fb__font-btn--active'); });
      btn.classList.add('fb__font-btn--active');
      state.font = btn.getAttribute('data-font');
      render();
    });
  });

  // ---- Quantity ----
  document.getElementById('fbQtyMinus').addEventListener('click', function() {
    if (state.qty > 1) {
      state.qty--;
      els.qtyInput.value = state.qty;
      render();
    }
  });
  document.getElementById('fbQtyPlus').addEventListener('click', function() {
    if (state.qty < 99) {
      state.qty++;
      els.qtyInput.value = state.qty;
      render();
    }
  });
  els.qtyInput.addEventListener('change', function() {
    var v = parseInt(this.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 99) v = 99;
    state.qty = v;
    this.value = v;
    render();
  });

  // ---- Add to Cart ----
  els.addBtn.addEventListener('click', function() {
    els.addBtn.disabled = true;
    els.addBtn.textContent = 'Добавляем...';
    els.cartMsg.textContent = '';
    els.cartMsg.className = 'fb__cart-msg';

    // Build line item properties
    var properties = {
      'Цвет рамки': state.frameColorName,
      'Текст сверху': state.textTop || '—',
      'Текст снизу': state.textBottom || '—',
      'Цвет текста': state.textColor,
      'Шрифт': state.font.replace(/'/g, '')
    };

    // Get product variant
    if (cfg.productHandle) {
      fetch('/products/' + cfg.productHandle + '.js')
        .then(function(r) { return r.json(); })
        .then(function(product) {
          var variantId = product.variants[0].id;
          return addToCart(variantId, state.qty, properties);
        })
        .catch(function() {
          showMsg('Товар не найден. Привяжите товар в настройках секции.', true);
          resetBtn();
        });
    } else {
      // No product linked — search for any available product
      fetch('/collections/all/products.json?limit=1')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.products && data.products.length > 0) {
            var variantId = data.products[0].variants[0].id;
            return addToCart(variantId, state.qty, properties);
          } else {
            showMsg('Нет товаров. Создайте товар в Shopify Admin.', true);
            resetBtn();
          }
        })
        .catch(function() {
          showMsg('Привяжите товар в настройках секции «Конструктор рамок»', true);
          resetBtn();
        });
    }
  });

  function addToCart(variantId, qty, properties) {
    var body = {
      items: [{
        id: variantId,
        quantity: qty,
        properties: properties
      }]
    };

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function(r) {
      if (!r.ok) throw new Error('cart error');
      return r.json();
    })
    .then(function() {
      showMsg('Добавлено в корзину!', false);
      resetBtn();
      // Update cart counter if exists
      var event = new CustomEvent('cart:refresh');
      document.dispatchEvent(event);
      // Try to update Dawn cart drawer
      if (typeof fetch === 'function') {
        fetch('/?sections=cart-icon-bubble')
          .then(function(r) { return r.json(); })
          .then(function(sections) {
            var bubble = document.getElementById('cart-icon-bubble');
            if (bubble && sections['cart-icon-bubble']) {
              var tmp = document.createElement('div');
              tmp.innerHTML = sections['cart-icon-bubble'];
              var newBubble = tmp.querySelector('#cart-icon-bubble');
              if (newBubble) bubble.innerHTML = newBubble.innerHTML;
            }
          })
          .catch(function() {});
      }
    })
    .catch(function() {
      showMsg('Ошибка при добавлении. Попробуйте ещё раз.', true);
      resetBtn();
    });
  }

  function showMsg(text, isError) {
    els.cartMsg.textContent = text;
    els.cartMsg.className = 'fb__cart-msg ' + (isError ? 'fb__cart-msg--err' : 'fb__cart-msg--ok');
  }

  function resetBtn() {
    els.addBtn.disabled = false;
    els.addBtn.textContent = 'Добавить в корзину';
  }

  // Initial render
  render();
  } // end init

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
