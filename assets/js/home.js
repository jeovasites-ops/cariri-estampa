/* home.js — Cariri Estampa | Mobile-First + Foco em Conversão */

async function loadHome() {
    try {
        const [prodResp, configResp] = await Promise.all([
            fetch('./assets/data/produtos.json'),
            fetch('./assets/data/home.json')
        ]);
        const prodData = await prodResp.json();
        const config   = await configResp.json();

        const produtos = prodData.lista_produtos;

        applyConfig();

        if (config.banners && config.banners.length > 0) {
            renderBanners(config.banners);
        }

        renderFeaturedProducts(produtos);

        if (config.bento_grid && config.bento_grid.length > 0) {
            renderBentoGrid(config.bento_grid);
        }

        window._produtos = produtos;
        window._config   = config;

    } catch (e) {
        console.error('Erro ao carregar home:', e);
    }
}

/* ─── Aplica dados na página ─── */
function applyConfig() {
    setTimeout(() => {
        const config = APP.config || {};
        const wa = config.contatos?.whatsapp || '5588999274659';
        const waBase = config.configuracoes?.mensagem_whatsapp_base || 'Olá!';

    // Links dinâmicos do WhatsApp
    const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(waBase)}`;

    const ids = ['whatsapp-float-btn', 'whatsapp-cta-btn', 'cta-whatsapp-link', 'footer-whatsapp-link'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = waLink;
    });

    // Sincroniza badge do carrinho
    const total = (APP.cart || []).reduce((s, i) => s + i.qty, 0);
    ['cart-count', 'nav-cart-count'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = total > 0 ? total : '0';
    });
    }, 300);
}

/* ─── Renderiza Banner Carousel do JSON ─── */
function renderBanners(banners) {
    const inner      = document.getElementById('hero-banners');
    const indicators = document.getElementById('hero-indicators');
    if (!inner || !indicators) return;

    inner.innerHTML      = '';
    indicators.innerHTML = '';

    const isMobile = window.innerWidth <= 768;

    banners.forEach((b, i) => {
        // Indicador
        const btn  = document.createElement('button');
        btn.type   = 'button';
        btn.setAttribute('data-bs-target', '#heroCarousel');
        btn.setAttribute('data-bs-slide-to', i);
        btn.setAttribute('aria-label', `Banner ${i + 1}`);
        if (i === 0) btn.classList.add('active');
        indicators.appendChild(btn);

        // Imagem correta para o viewport
        const img = (isMobile && b.imagem_mobile) ? b.imagem_mobile : b.imagem_desktop;

        // Tema do banner
        const themeClass = b.estilo === 'suave' ? 'suave' : '';

        // Item do carousel
        const item = document.createElement('div');
        item.className = `carousel-item${i === 0 ? ' active' : ''}`;
        item.innerHTML = `
            <div class="banner-item ${themeClass}" style="background-image:url('${img}');">
                <div class="banner-content">
                    <h2 class="banner-title">${b.titulo}</h2>
                    <p class="banner-subtitle">${b.subtitulo}</p>
                    <a href="${b.link_botao}" class="btn-banner">${b.texto_botao} <i class="ph-bold ph-arrow-right"></i></a>
                </div>
            </div>
        `;
        inner.appendChild(item);
    });

    // Re-inicializa o Carousel Bootstrap (agora que os slides existem)
    const carouselEl = document.getElementById('heroCarousel');
    if (carouselEl && typeof bootstrap !== 'undefined') {
        new bootstrap.Carousel(carouselEl, { interval: 5000, ride: 'carousel' });
    }
}

/* ─── Renderiza Produtos em Destaque ─── */
function renderFeaturedProducts(produtos) {
    const featured = produtos.filter(p => p.destaque === true);
    const grid     = document.getElementById('featured-products');
    if (!grid) return;

    grid.innerHTML = '';

    // Máximo 4 destaques na home
    featured.slice(0, 4).forEach(p => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3';
        col.innerHTML = `
            <div class="product-card" onclick="window.location.href='loja.html?detalhe=${p.id}'" style="cursor: pointer;">
                <div class="card-img">
                    <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
                    <span class="badge-hot">${p.categoria}</span>
                </div>
                <div class="card-body">
                    <div class="card-tag">${p.categoria}</div>
                    <div class="card-title">${p.nome}</div>
                    <div class="card-footer">
                        <span class="card-price">${APP.formatMoney(p.preco)}</span>
                        <button class="btn-add-card" onclick="event.stopPropagation(); addToCartHome(${p.id})" aria-label="Adicionar ao carrinho">
                            <i class="ph-bold ph-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });

    // Se não tiver produtos com destaque
    if (featured.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5" style="color:#A0AEC0;">
                <i class="ph ph-package" style="font-size:3rem;display:block;margin-bottom:12px;"></i>
                Em breve novidades!
            </div>
        `;
    }
}

/* ─── Adicionar ao carrinho com feedback ─── */
function addToCartHome(id) {
    const p = (window._produtos || []).find(item => item.id === id);
    if (!p) return;

    APP.addToCart(p);

    // Atualiza badges
    const total = APP.cart.reduce((s, i) => s + i.qty, 0);
    ['cart-count', 'nav-cart-count'].forEach(badgeId => {
        const badge = document.getElementById(badgeId);
        if (!badge) return;
        badge.textContent = total;
        badge.style.transform = 'scale(1.6)';
        badge.style.transition = 'transform 0.15s';
        setTimeout(() => badge.style.transform = 'scale(1)', 250);
    });
}

/* ─── Renderiza Bento Grid do JSON ─── */
function renderBentoGrid(items) {
    const container = document.getElementById('bentoGridContainer');
    if (!container) return;

    container.innerHTML = ''; // limpa placeholders
    
    items.forEach(item => {
        if (item.tipo === 'imagem') {
            const html = `
                <a href="${item.link}" class="bento-card ${item.classe_tamanho}">
                    <img src="${item.imagem}" alt="${item.titulo}" class="bento-img">
                    <div class="bento-overlay">
                        <div class="bento-icon" style="background:rgba(255,255,255,0.15);color:#fff;"><i class="${item.icone}"></i></div>
                        <h3>${item.titulo}</h3>
                        <p>${item.subtitulo}</p>
                        <span class="bento-cta">${item.texto_cta} <i class="ph ph-arrow-right"></i></span>
                    </div>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', html);
        } else if (item.tipo === 'estatistica') {
            const Wrapper = item.link ? 'a' : 'div';
            const linkAttr = item.link ? `href="${item.link}" target="_blank"` : '';
            const html = `
                <${Wrapper} ${linkAttr} class="bento-card ${item.classe_tamanho}" style="background: ${item.estilo_fundo}; color:#fff; text-decoration: none;">
                    <i class="${item.icone_bg}" style="position:absolute;right:12px;top:12px;font-size:3.5rem;opacity:.15;"></i>
                    <span class="bento-stat-num">${item.numero}</span>
                    <span class="bento-stat-label">${item.rotulo}</span>
                </${Wrapper}>
            `;
            container.insertAdjacentHTML('beforeend', html);
        } else if (item.tipo === 'whatsapp') {
            const html = `
                <a href="${item.link}" target="_blank" class="bento-card ${item.classe_tamanho}" style="background: ${item.estilo_fundo}; color:#fff; text-decoration: none;">
                    <i class="${item.icone_bg}" style="position:absolute;right:12px;top:12px;font-size:3.5rem;opacity:.15;"></i>
                    <i class="${item.icone_destaque}" style="font-size:1.8rem;margin-bottom:6px;"></i>
                    <span class="bento-stat-label" style="font-size:.92rem;font-weight:700;">${item.rotulo}</span>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }
    });
}

/* ─── Inicializa quando DOM carregou ─── */
document.addEventListener('DOMContentLoaded', () => {
    loadHome();

    // Chips de categoria: highlight no chip clicado
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
