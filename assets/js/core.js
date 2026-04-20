/* 
  Cariri Estampa - CORE JS
  Gerencia dados JSON e Carrinho
*/

const APP = {
    config: {},
    cart: JSON.parse(localStorage.getItem('cariri_cart')) || [],
    
    init: async function() {
        await this.loadConfig();
        this.updateCartBadge();
    },

    loadConfig: async function() {
        try {
            const [respGeral, respContatos] = await Promise.all([
                fetch('./assets/data/geral.json'),
                fetch('./assets/data/contatos.json')
            ]);
            
            const geral = await respGeral.json();
            const contatos = await respContatos.json();
            
            // Reconstroi o objeto para manter compatibilidade com sistemas legados do site
            this.config = Object.assign({}, geral, { contatos });
            this.applyMeta();
        } catch (e) { 
            console.error("Erro ao carregar configurações modulares", e); 
        }
    },

    applyMeta: function() {
        // Aplica logo e favicon dinamicamente
        if(document.getElementById('links-logo')) document.getElementById('links-logo').src = this.config.identidade.logo;
    },

    // CARRINHO
    addToCart: function(product, qty = 1) {
        const index = this.cart.findIndex(item => item.id === product.id);
        if (index > -1) {
            this.cart[index].qty += qty;
        } else {
            this.cart.push({ ...product, qty });
        }
        this.saveCart();
        this.showToast(`${product.nome} adicionado!`);
    },

    saveCart: function() {
        localStorage.setItem('cariri_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    },

    updateCartBadge: function() {
        const total = this.cart.reduce((acc, item) => acc + item.qty, 0);
        // Atualiza TODOS os badges de carrinho na página
        ['cart-count', 'nav-cart-count'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = total > 0 ? total : '0';
        });
    },

    showToast: function(msg) {
        // Toast leve no topo da tela, sem bloquear o usuário
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.style.cssText = [
                'position:fixed', 'top:72px', 'left:50%', 'transform:translateX(-50%)',
                'background:#1A202C', 'color:#fff', 'padding:12px 24px',
                'border-radius:999px', 'font-size:.88rem', 'font-weight:600',
                'z-index:99999', 'opacity:0', 'transition:opacity .25s',
                'pointer-events:none', 'white-space:nowrap',
                'box-shadow:0 8px 24px rgba(0,0,0,.3)'
            ].join(';');
            document.body.appendChild(toast);
        }
        toast.textContent = '✓ ' + msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.style.opacity = '0', 2000);
    },

    formatMoney: function(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    },

    generateWhatsAppLink: function() {
        if(this.cart.length === 0) return alert("Seu carrinho está vazio!");
        
        let text = `*NOVO PEDIDO - CARIRI ESTAMPA*\n\n`;
        let total = 0;

        this.cart.forEach(item => {
            text += `• ${item.qty}x ${item.nome} - RM ${this.formatMoney(item.preco * item.qty)}\n`;
            total += item.preco * item.qty;
        });

        text += `\n*TOTAL ESTIMADO:* ${this.formatMoney(total)}`;
        text += `\n\n_Vim pelo site e gostaria de combinar o pagamento e entrega._`;

        const encoded = encodeURIComponent(text);
        const phone = this.config.contatos.whatsapp || "5588999999999";
        return `https://wa.me/${phone}?text=${encoded}`;
    }
};

$(document).ready(() => APP.init());
