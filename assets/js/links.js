/* links.js — Cariri Estampa Links Page Logic */

async function loadLinks() {
    const linksContainer = document.getElementById('links-dynamic-container');
    if (!linksContainer) return;

    try {
        const resp = await fetch('./assets/data/bio_links.json');
        const config = await resp.json();

        if (config.links_page && config.links_page.length > 0) {
            linksContainer.innerHTML = ''; // Limpa placeholders
            
            config.links_page.forEach(link => {
                const card = document.createElement('a');
                card.href = link.url;
                card.className = 'link-card';
                if (link.url.startsWith('http')) card.target = '_blank';

                card.innerHTML = `
                    <div class="link-content">
                        <div class="link-icon ${link.color_class}"><i class="${link.icon}"></i></div>
                        <span class="link-text">${link.label}</span>
                    </div>
                    <i class="ph ph-caret-right link-arrow"></i>
                `;
                linksContainer.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar links:", e);
    }
}

document.addEventListener('DOMContentLoaded', loadLinks);
