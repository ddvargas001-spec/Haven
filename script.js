/* ==========================================================================
   HAVEN — script.js
   Lógica del carrito de compras (100% en el navegador, sin backend ni pagos)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    /* ---------------------------------------------------------------------
       1. ESTADO DEL CARRITO
       cart es un arreglo de objetos: { id, name, price, icon, qty }
       Vive únicamente en memoria: se reinicia si se recarga la página.
       --------------------------------------------------------------------- */
    var cart = [];

    /* ---------------------------------------------------------------------
       2. REFERENCIAS AL DOM
       --------------------------------------------------------------------- */
    var addButtons        = document.querySelectorAll('.btn-add');
    var cartBadge         = document.getElementById('cartBadge');
    var cartItemsContainer = document.getElementById('cartItemsContainer');
    var cartTotalEl       = document.getElementById('cartTotal');
    var clearCartBtn      = document.getElementById('clearCartBtn');
    var checkoutBtn       = document.getElementById('checkoutBtn');

    var cartModalEl  = document.getElementById('cartModal');
    var orderModalEl = document.getElementById('orderModal');

    // Instancias de los modales de Bootstrap
    var cartModal  = new bootstrap.Modal(cartModalEl);
    var orderModal = new bootstrap.Modal(orderModalEl);

    /* ---------------------------------------------------------------------
       3. UTILIDADES
       --------------------------------------------------------------------- */
    function formatPrice(value) {
        return '$' + value.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getCartCount() {
        return cart.reduce(function (total, item) {
            return total + item.qty;
        }, 0);
    }

    function getCartTotal() {
        return cart.reduce(function (total, item) {
            return total + (item.qty * item.price);
        }, 0);
    }

    function findItem(id) {
        return cart.find(function (item) {
            return item.id === id;
        });
    }

    /* ---------------------------------------------------------------------
       4. RENDERIZADO DEL CARRITO
       --------------------------------------------------------------------- */
    function renderCart() {

        // --- Contador en el ícono del carrito ---
        var count = getCartCount();
        cartBadge.textContent = count;
        cartBadge.classList.toggle('is-hidden', count === 0);

        // --- Lista de productos dentro del modal ---
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML =
                '<div class="cart-empty">' +
                    '<span>🛒</span>' +
                    '<p>Tu carrito está vacío.</p>' +
                    '<p>Agrega cócteles o botellas desde el catálogo.</p>' +
                '</div>';
        } else {
            cart.forEach(function (item) {
                var row = document.createElement('div');
                row.className = 'cart-item';
                row.innerHTML =
                    '<div class="cart-item-icon">' + item.icon + '</div>' +
                    '<div class="cart-item-info">' +
                        '<h4>' + item.name + '</h4>' +
                        '<p class="cart-item-price">' + formatPrice(item.price) + ' c/u</p>' +
                    '</div>' +
                    '<div class="cart-item-actions">' +
                        '<div class="qty-control">' +
                            '<button type="button" class="qty-decrease" data-id="' + item.id + '" aria-label="Disminuir cantidad de ' + item.name + '">−</button>' +
                            '<span>' + item.qty + '</span>' +
                            '<button type="button" class="qty-increase" data-id="' + item.id + '" aria-label="Aumentar cantidad de ' + item.name + '">+</button>' +
                        '</div>' +
                        '<button type="button" class="cart-item-remove" data-id="' + item.id + '">Eliminar</button>' +
                    '</div>';
                cartItemsContainer.appendChild(row);
            });
        }

        // --- Total ---
        cartTotalEl.textContent = formatPrice(getCartTotal());

        // --- Botones del pie del carrito ---
        var isEmpty = cart.length === 0;
        checkoutBtn.disabled = isEmpty;
        clearCartBtn.disabled = isEmpty;
    }

    /* ---------------------------------------------------------------------
       5. ACCIONES SOBRE EL CARRITO
       --------------------------------------------------------------------- */
    function addToCart(product) {
        var existing = findItem(product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                icon: product.icon,
                qty: 1
            });
        }
        renderCart();
    }

    function increaseQty(id) {
        var item = findItem(id);
        if (!item) return;
        item.qty += 1;
        renderCart();
    }

    function decreaseQty(id) {
        var item = findItem(id);
        if (!item) return;
        item.qty -= 1;
        if (item.qty <= 0) {
            removeFromCart(id);
            return;
        }
        renderCart();
    }

    function removeFromCart(id) {
        cart = cart.filter(function (item) {
            return item.id !== id;
        });
        renderCart();
    }

    function clearCart() {
        cart = [];
        renderCart();
    }

    /* ---------------------------------------------------------------------
       6. EVENTOS: BOTONES "AGREGAR AL CARRITO"
       --------------------------------------------------------------------- */
    addButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var product = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price),
                icon: btn.dataset.icon || '🍸'
            };

            addToCart(product);

            // Pequeña confirmación visual en el propio botón
            var originalText = btn.textContent;
            btn.textContent = 'Agregado ✓';
            btn.classList.add('is-added');
            btn.disabled = true;

            setTimeout(function () {
                btn.textContent = originalText;
                btn.classList.remove('is-added');
                btn.disabled = false;
            }, 900);
        });
    });

    /* ---------------------------------------------------------------------
       7. EVENTOS DENTRO DEL MODAL DEL CARRITO (delegación de eventos)
       --------------------------------------------------------------------- */
    cartItemsContainer.addEventListener('click', function (e) {
        var target = e.target;

        if (target.classList.contains('qty-increase')) {
            increaseQty(target.dataset.id);
        } else if (target.classList.contains('qty-decrease')) {
            decreaseQty(target.dataset.id);
        } else if (target.classList.contains('cart-item-remove')) {
            removeFromCart(target.dataset.id);
        }
    });

    /* ---------------------------------------------------------------------
       8. VACIAR CARRITO
       --------------------------------------------------------------------- */
    clearCartBtn.addEventListener('click', function () {
        clearCart();
    });

    /* ---------------------------------------------------------------------
       9. FINALIZAR PEDIDO
       No se procesa ningún pago: solo se confirma el pedido y se vacía
       el carrito.
       --------------------------------------------------------------------- */
    checkoutBtn.addEventListener('click', function () {
        if (cart.length === 0) return;

        cartModal.hide();
        clearCart();

        // Esperamos a que termine de cerrarse el modal del carrito
        // antes de mostrar la confirmación, para que no se empalmen.
        function onCartHidden() {
            orderModal.show();
            cartModalEl.removeEventListener('hidden.bs.modal', onCartHidden);
        }
        cartModalEl.addEventListener('hidden.bs.modal', onCartHidden);
    });

    /* ---------------------------------------------------------------------
       10. ESTADO INICIAL
       --------------------------------------------------------------------- */
    renderCart();


    /* =======================================================================
       BUSCADOR DE PRODUCTOS
       Filtra el producto destacado, los cócteles y las botellas por nombre
       y descripción, sin distinguir mayúsculas/minúsculas ni acentos.
       ======================================================================= */
    var searchInput       = document.getElementById('productSearch');
    var searchClearBtn    = document.getElementById('searchClearBtn');
    var searchEmptyMessage = document.getElementById('searchEmptyMessage');

    var searchableProducts = document.querySelectorAll(
        '.producto-destacado, .grid-cocteles .card, .grid-botellas .botella-card'
    );
    var cocktailCards = document.querySelectorAll('.grid-cocteles .card');
    var bottleCards   = document.querySelectorAll('.grid-botellas .botella-card');
    var tituloCocteles = document.getElementById('tituloCocteles');
    var tituloBotellas = document.getElementById('tituloBotellas');

    function normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function anyVisible(nodeList) {
        return Array.prototype.some.call(nodeList, function (el) {
            return !el.classList.contains('is-hidden');
        });
    }

    function filterProducts() {
        var query = searchInput ? normalizeText(searchInput.value.trim()) : '';
        var visibleCount = 0;

        searchableProducts.forEach(function (product) {
            var titleEl = product.querySelector('h2, h3');
            var descEl  = product.querySelector('p:not(.subtitle)');

            var text = normalizeText(
                (titleEl ? titleEl.textContent : '') + ' ' +
                (descEl ? descEl.textContent : '')
            );

            var matches = query === '' || text.indexOf(query) !== -1;
            product.classList.toggle('is-hidden', !matches);

            if (matches) visibleCount++;
        });

        // Ocultar el encabezado de una sección si ninguno de sus
        // productos coincide con la búsqueda.
        if (tituloCocteles) {
            tituloCocteles.classList.toggle('is-hidden', !anyVisible(cocktailCards));
        }
        if (tituloBotellas) {
            tituloBotellas.classList.toggle('is-hidden', !anyVisible(bottleCards));
        }

        if (searchEmptyMessage) {
            searchEmptyMessage.classList.toggle('is-hidden', visibleCount > 0);
        }
        if (searchClearBtn) {
            searchClearBtn.classList.toggle('is-hidden', !searchInput || searchInput.value.length === 0);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', function () {
            searchInput.value = '';
            filterProducts();
            searchInput.focus();
        });
    }


    /* =======================================================================
       CARRUSEL DE FOTOS — sección Reservaciones
       (independiente de la lógica del carrito)
       ======================================================================= */
    var slides = document.querySelectorAll('.carousel-slide');
    var dots   = document.querySelectorAll('.carousel-dots .dot');
    var currentSlide = 0;
    var carouselInterval;

    function showSlide(index) {
        slides.forEach(function (slide, i) {
            slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === index);
        });
        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    if (slides.length > 0) {
        showSlide(0);
        carouselInterval = setInterval(nextSlide, 4500);

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                clearInterval(carouselInterval);
                showSlide(i);
                carouselInterval = setInterval(nextSlide, 4500);
            });
        });
    }

});
