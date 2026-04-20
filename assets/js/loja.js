/* ================================
   LOJA.JS — Cariri Estampa 2026
   Busca, Filtros, Sort, Mini Cart
   e Toggle de Layout
   ================================ */

// Estado Global
const state = {
    allProducts: [],
    filtered: [],
    activeCategory: 'Todos',
    sortMode: 'default',
    searchQuery: '',
    isGridLayout: true,
};

/* ==============================
   INICIALIZAÇÃO
   ============================== */
$(document).ready(async () => {
    // Carrega em paralelo para melhor performance
    loadCategories();
    loadProducts();
    
    setupSearch();
    setupSort();
    // setupCart() Removido: Checkout Unificado
    setupLayoutToggle();
    handleURLCategory();
});

/* ==============================
   CARREGAR DADOS
   ============================== */
async function loadCategories() {
    try {
        const resp = await fetch('./assets/data/plugins.json');
        const data = await resp.json();
        const strip = $('#category-tabs');
        strip.html('');
        data.categorias.forEach(cat => {
            strip.append(
                `<button class="cat-tab ${cat === 'Todos' ? 'active' : ''}"
                         data-cat="${cat}">${cat}</button>`
            );
        });
        // Evento de clique nas abas
        strip.on('click', '.cat-tab', function () {
            strip.find('.cat-tab').removeClass('active');
            $(this).addClass('active');
            state.activeCategory = $(this).data('cat');
            applyFilters();
        });
    } catch (e) { console.error('Categorias:', e); }
}

async function loadProducts() {
    try {
        const resp = await fetch('./assets/data/produtos.json');
        const data = await resp.json();
        state.allProducts = data.lista_produtos;
        applyFilters();
    } catch (e) { console.error('Produtos:', e); }
}

/* ==============================
   URL PARAM (ex: loja.html?cat=X & detalhe=Y)
   ============================== */
function handleURLCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    const detalheId = urlParams.get('detalhe');

    if (cat) {
        // Normaliza: remove acentos para comparar (ex: Vestuario = Vestuário)
        const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        
        // Acha a categoria no JSON que corresponde (com ou sem acento)
        setTimeout(() => {
            const tabs = $('#category-tabs .cat-tab');
            let matched = false;
            tabs.each(function() {
                const tabCat = $(this).data('cat');
                if (normalize(tabCat) === normalize(cat)) {
                    tabs.removeClass('active');
                    $(this).addClass('active');
                    state.activeCategory = tabCat; // usa o valor real com acento
                    matched = true;
                }
            });
            if (!matched) {
                // tenta busca direta
                state.activeCategory = cat;
            }
            applyFilters();
        }, 150);
    }

    if (detalheId) {
        // Aguarda até os produtos estarem carregados do JSON
        const checkInterval = setInterval(() => {
            if (state.allProducts.length > 0) {
                clearInterval(checkInterval);
                openProductModal(parseInt(detalheId));
            }
        }, 100);
        
        // Timeout de segurança (para se der erro no fetch)
        setTimeout(() => clearInterval(checkInterval), 5000);
    }
}

/* ==============================
   FILTROS + ORDENAÇÃO (CORE)
   ============================== */
function applyFilters() {
    let result = [...state.allProducts];

    // 1. Filtro de categoria
    if (state.activeCategory !== 'Todos') {
        result = result.filter(p => p.categoria === state.activeCategory);
    }

    // 2. Filtro de busca
    if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        result = result.filter(p =>
            p.nome.toLowerCase().includes(q) ||
            p.descricao.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
        );
    }

    // 3. Ordenação
    switch (state.sortMode) {
        case 'price-asc':
            result.sort((a, b) => a.preco - b.preco);
            break;
        case 'price-desc':
            result.sort((a, b) => b.preco - a.preco);
            break;
        case 'rating':
            result.sort((a, b) => b.avaliacao - a.avaliacao);
            break;
        default:
            result.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
    }

    state.filtered = result;
    renderProducts();
}

/* ==============================
   RENDERIZAÇÃO DOS CARDS
   ============================== */
function renderProducts() {
    const grid = $('#products-grid');
    const empty = $('#emptyState');
    const count = $('#product-count');

    grid.html('');

    if (state.filtered.length === 0) {
        empty.removeClass('d-none');
        count.text('0 produtos');
        return;
    }

    empty.addClass('d-none');
    count.text(`${state.filtered.length} produto${state.filtered.length !== 1 ? 's' : ''}`);

    const isGrid = state.isGridLayout;
    const colClass = isGrid ? 'col-6 col-md-4 col-lg-3' : 'col-12 col-md-6';

    if (!isGrid) grid.closest('.row').addClass('list-view');
    else grid.closest('.row').removeClass('list-view');

    state.filtered.forEach((p, i) => {
        const stars = renderStars(p.avaliacao);
        const badge = p.badge
            ? `<span class="prod-card__badge ${getBadgeClass(p.badge)}">${p.badge}</span>`
            : '';
        const oldPrice = p.preco_antigo
            ? `<span class="prod-card__old-price">R$ ${p.preco_antigo.toFixed(2).replace('.', ',')}</span>`
            : '';
        const desc = !isGrid
            ? `<div class="prod-card__desc">${p.descricao}</div>` : '';

        const card = `
            <div class="${colClass}" style="animation-delay: ${i * 50}ms">
                <div class="prod-card" data-id="${p.id}">
                    <div class="prod-card__img-wrap">
                        ${badge}
                        <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
                    </div>
                    <div class="prod-card__body">
                        <div class="prod-card__cat">${p.categoria}</div>
                        <div class="prod-card__name">${p.nome}</div>
                        ${desc}
                        <div class="prod-card__stars">
                            ${stars}
                            <span>(${p.total_avaliacoes})</span>
                        </div>
                        <div class="prod-card__footer">
                            <div class="prod-card__price-wrap">
                                ${oldPrice}
                                <span class="prod-card__price">R$ ${p.preco.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <button class="btn-add-to-cart" data-id="${p.id}" aria-label="Adicionar ao carrinho">
                                <i class="ph-bold ph-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.append(card);
    });

    // Evento abrir detalhes do produto
    grid.find('.prod-card').on('click', function (e) {
        // Se clicar no botão add, não abre o modal (já tem stopPropagation)
        const id = parseInt($(this).data('id'));
        openProductModal(id);
    });

    // Evento adicionar ao carrinho (card)
    grid.find('.btn-add-to-cart').on('click', function (e) {
        e.stopPropagation();
        const id = parseInt($(this).data('id'));
        const product = state.allProducts.find(p => p.id === id);
        if (!product) return;

        APP.addToCart(product);
        animateAddBtn($(this));
        renderMiniCart();
        openCart();
    });
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= Math.round(rating)
            ? '<i class="ph-fill ph-star"></i>'
            : '<i class="ph ph-star"></i>';
    }
    return html;
}

function getBadgeClass(badge) {
    if (badge.includes('OFF') || badge === 'Mais Vendido') return '';
    if (badge === 'Novo') return 'green';
    if (badge === 'Destaque') return 'dark';
    return '';
}

function animateAddBtn(btn) {
    btn.addClass('added').html('<i class="ph-fill ph-check"></i>');
    setTimeout(() => {
        btn.removeClass('added').html('<i class="ph-bold ph-plus"></i>');
    }, 1200);

    // Animação no badge do carrinho
    const badge = $('#cart-count');
    badge.css('transform', 'scale(1.5)');
    setTimeout(() => badge.css('transform', 'scale(1)'), 300);
}

/* ==============================
   BUSCA
   ============================== */
function setupSearch() {
    const toggleBtn = $('#toggleSearchBtn');
    const searchWrap = $('#searchBarWrap');
    const input = $('#searchInput');
    const clearBtn = $('#clearSearchBtn');
    const suggestions = $('#searchSuggestions');

    toggleBtn.on('click', () => {
        searchWrap.toggleClass('open');
        if (searchWrap.hasClass('open')) {
            setTimeout(() => input.focus(), 100);
        } else {
            suggestions.addClass('d-none');
        }
    });

    input.on('input', function () {
        const query = $(this).val().toLowerCase().trim();
        state.searchQuery = query;
        clearBtn.toggleClass('visible', query.length > 0);
        
        if (query.length >= 2) {
            renderSuggestions(query);
            suggestions.removeClass('d-none');
        } else {
            suggestions.addClass('d-none');
        }
        
        applyFilters();
    });

    function renderSuggestions(query) {
        const matches = state.allProducts.filter(p => 
            p.nome.toLowerCase().includes(query) || 
            p.categoria.toLowerCase().includes(query)
        ).slice(0, 5); // Limita a 5 sugestões

        if (matches.length > 0) {
            suggestions.html(matches.map(p => `
                <div class="suggestion-item" data-id="${p.id}">
                    <img src="${p.imagem}" class="suggestion-img" alt="${p.nome}">
                    <div class="suggestion-info">
                        <span class="suggestion-name">${p.nome}</span>
                        <span class="suggestion-cat">${p.categoria}</span>
                    </div>
                </div>
            `).join(''));

            $('.suggestion-item').on('click', function() {
                const name = $(this).find('.suggestion-name').text();
                input.val(name);
                state.searchQuery = name;
                suggestions.addClass('d-none');
                applyFilters();
            });
        } else {
            suggestions.html('<div class="suggestion-item"><span class="suggestion-cat">Nenhum resultado encontrado</span></div>');
        }
    }

    clearBtn.on('click', () => {
        input.val('');
        state.searchQuery = '';
        clearBtn.removeClass('visible');
        suggestions.addClass('d-none');
        input.focus();
        applyFilters();
    });

    // Fechar ao clicar fora
    $(document).on('click', (e) => {
        if (!$(e.target).closest('#searchBarWrap').length) {
            suggestions.addClass('d-none');
        }
    });

    input.on('keydown', function (e) {
        if (e.key === 'Escape') {
            searchWrap.removeClass('open');
            suggestions.addClass('d-none');
        }
    });
}

/* ==============================
   ORDENAÇÃO (SORT DRAWER)
   ============================== */
function setupSort() {
    const openBtn = $('#openSortBtn');
    const drawer = $('#sortDrawer');
    const overlay = $('#sortOverlay');

    const openSort = () => {
        drawer.addClass('open');
        overlay.addClass('open');
        $('body').css('overflow', 'hidden');
    };
    const closeSort = () => {
        drawer.removeClass('open');
        overlay.removeClass('open');
        $('body').css('overflow', '');
    };

    openBtn.on('click', openSort);
    overlay.on('click', closeSort);

    $('#sortOptions .sort-opt').on('click', function () {
        const mode = $(this).data('sort');
        state.sortMode = mode;

        // Atualiza visual das opções
        $('#sortOptions .sort-opt').removeClass('active');
        $(this).addClass('active');

        // Indica ordenação ativa no botão
        openBtn.toggleClass('active-sort', mode !== 'default');

        applyFilters();
        closeSort();
    });
}

/* ==============================
   MINI CARRINHO
   ============================== */
function setupCart() {
    const openBtn = $('#openCartBtn');
    const closeBtn = $('#closeCartBtn');
    const overlay = $('#cartOverlay');
    const checkoutBtn = $('#checkoutBtn');

    openBtn.on('click', openCart);
    closeBtn.on('click', closeCart);
    overlay.on('click', closeCart);

    checkoutBtn.on('click', () => {
        const link = APP.generateWhatsAppLink();
        if (link) window.open(link, '_blank');
    });

    renderMiniCart();
}

function openCart() {
    $('#cartDrawer').addClass('open');
    $('#cartOverlay').addClass('open');
    $('body').css('overflow', 'hidden');
    renderMiniCart();
}

function closeCart() {
    $('#cartDrawer').removeClass('open');
    $('#cartOverlay').removeClass('open');
    $('body').css('overflow', '');
}

function renderMiniCart() {
    const body = $('#cartBody');
    const footer = $('#cartDrawer .cart-drawer__footer');
    const emptyState = $('#cartEmpty');
    const qtyLabel = $('#cart-items-qty');
    const totalEl = $('#cartTotal');
    const countBadge = $('#cart-count');

    body.html('');

    const cart = APP.cart;
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + i.preco * i.qty, 0);

    countBadge.text(totalItems);
    // Atualiza também o badge da floating nav
    const navBadge = document.getElementById('nav-cart-count');
    if (navBadge) navBadge.textContent = totalItems;
    qtyLabel.text(`${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`);
    totalEl.text(APP.formatMoney(totalPrice));

    if (cart.length === 0) {
        footer.hide();
        emptyState.show();
        body.hide();
        return;
    }

    footer.show();
    emptyState.hide();
    body.show();

    cart.forEach((item, idx) => {
        body.append(`
            <div class="mini-cart-item" data-idx="${idx}">
                <img src="${item.imagem}" alt="${item.nome}" class="mini-cart-item__img">
                <div class="mini-cart-item__info">
                    <div class="mini-cart-item__name">${item.nome}</div>
                    <div class="mini-cart-item__price">${APP.formatMoney(item.preco)}</div>
                    <div class="mini-cart-item__qty">
                        <button class="qty-btn" data-action="minus" data-idx="${idx}">
                            <i class="ph-bold ph-minus"></i>
                        </button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" data-action="plus" data-idx="${idx}">
                            <i class="ph-bold ph-plus"></i>
                        </button>
                    </div>
                </div>
                <button class="btn-remove-mini" data-idx="${idx}" aria-label="Remover">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `);
    });

    // Eventos de quantidade e remoção
    body.find('.qty-btn').on('click', function () {
        const idx = parseInt($(this).data('idx'));
        const action = $(this).data('action');
        if (action === 'plus') APP.cart[idx].qty++;
        else if (action === 'minus') {
            APP.cart[idx].qty--;
            if (APP.cart[idx].qty < 1) APP.cart.splice(idx, 1);
        }
        APP.saveCart();
        renderMiniCart();
    });

    body.find('.btn-remove-mini').on('click', function () {
        const idx = parseInt($(this).data('idx'));
        APP.cart.splice(idx, 1);
        APP.saveCart();
        renderMiniCart();
    });
}

/* ==============================
   TOGGLE GRID / LISTA
   ============================== */
function setupLayoutToggle() {
    $('#toggleLayoutBtn').on('click', function () {
        state.isGridLayout = !state.isGridLayout;
        const icon = $('#layoutIcon');
        if (state.isGridLayout) {
            icon.attr('class', 'ph ph-squares-four');
        } else {
            icon.attr('class', 'ph ph-list');
        }
        renderProducts();
    });
}

/* ==============================
   MODAL DE PRODUTO
   ============================== */
let currentModalProductId = null;

function openProductModal(id) {
    console.log("Abrindo modal para ID:", id);
    const product = state.allProducts.find(p => Number(p.id) === Number(id));
    
    if (!product) {
        console.error("Produto não encontrado no array state.allProducts. ID consultado:", id);
        return;
    }

    console.log("Produto encontrado:", product.nome);
    currentModalProductId = product.id;

    // Limpa estado anterior
    $('#modalProdImg').attr('src', '');
    $('#modalProdTitle').text('Carregando...');
    
    // Alimenta Modal
    $('#modalProdImg').attr('src', product.imagem);
    $('#modalProdCat').text(product.categoria);
    $('#modalProdTitle').text(product.nome);
    $('#modalProdDesc').html(product.descricao || 'Sem descrição detalhada disponível.');
    $('#modalProdStars').html(renderStars(product.avaliacao) + ` <span>(${product.total_avaliacoes})</span>`);
    
    if (product.preco_antigo) {
        $('#modalProdOldPrice').text(`R$ ${product.preco_antigo.toFixed(2).replace('.', ',')}`).show();
    } else {
        $('#modalProdOldPrice').hide();
    }
    $('#modalProdPrice').text(`R$ ${product.preco.toFixed(2).replace('.', ',')}`);
    
    // Atualiza botão com preço
    $('#modalQtyInput').val(1);
    updateModalAddBtnPrice(product.preco);

    $('#productModal').addClass('active');
    $('body').css('overflow', 'hidden'); 
}

function closeProductModal() {
    $('#productModal').removeClass('active');
    $('body').css('overflow', '');
    currentModalProductId = null;
    
    // Remove parâmetro `detalhe` da URL limpar
    const url = new URL(window.location);
    if(url.searchParams.has('detalhe')) {
        url.searchParams.delete('detalhe');
        window.history.replaceState({}, '', url);
    }
}

// Lógica de Qtde no Modal
$('#modalQtyMinus').on('click', () => {
    let val = parseInt($('#modalQtyInput').val());
    if (val > 1) {
        val--;
        $('#modalQtyInput').val(val);
        const p = state.allProducts.find(p => p.id === currentModalProductId);
        if (p) updateModalAddBtnPrice(p.preco * val);
    }
});

$('#modalQtyPlus').on('click', () => {
    let val = parseInt($('#modalQtyInput').val());
    val++;
    $('#modalQtyInput').val(val);
    const p = state.allProducts.find(p => p.id === currentModalProductId);
    if (p) updateModalAddBtnPrice(p.preco * val);
});

function updateModalAddBtnPrice(total) {
    $('#modalAddPrice').text(`• R$ ${total.toFixed(2).replace('.', ',')}`);
}

// Fechar Modal
$('#closeProductModal').on('click', closeProductModal);

// Adicionar a partir do modal
$('#modalAddToCartBtn').on('click', () => {
    if (!currentModalProductId) return;
    const product = state.allProducts.find(p => p.id === currentModalProductId);
    if (!product) return;
    
    let qty = parseInt($('#modalQtyInput').val()) || 1;
    
    // Usa lógica customizada para somar x quantidade
    for(let i=0; i < qty; i++) {
        APP.addToCart(product);
    }
    
    closeProductModal();
    renderMiniCart();
    openCart();
});
