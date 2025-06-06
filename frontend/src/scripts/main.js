/**
 * DONATO PASTRELLO WEBSITE - VERSIONE FINALE FUNZIONANTE
 */

'use strict';

// === UTILITY FUNCTIONS ===
const utils = {
    select: (selector) => document.querySelector(selector),
    selectAll: (selector) => document.querySelectorAll(selector),
    
    smoothScroll: (target, duration = 1000) => {
        const targetElement = typeof target === 'string' ? utils.select(target) : target;
        if (!targetElement) return;
        
        const targetPosition = targetElement.offsetTop - 80;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    },

    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }
};

// === LIGHTBOX FUNCTIONS GLOBALI ===
window.openLightbox = function(imageUrl, title, description = '') {
    console.log('🚀 APERTURA LIGHTBOX:', { imageUrl, title, description });
    
    // Rimuovi lightbox esistente se presente
    const existingLightbox = document.querySelector('.lightbox');
    if (existingLightbox) {
        existingLightbox.remove();
    }
    
    // Controlla se c'è una descrizione valida
    const hasDescription = description && description.trim() !== '' && description !== 'undefined' && description !== '[object Object]';
    
    // Crea lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-overlay" onclick="closeLightbox()"></div>
        <div class="lightbox-content">
            <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
            <div class="lightbox-image-container">
                <img src="${imageUrl}" alt="${title}" class="lightbox-image">
                ${hasDescription ? `
                <div class="lightbox-info">
                    <button class="lightbox-discover-btn" onclick="toggleLightboxDescription()">Scopri di più</button>
                    <div class="lightbox-description" id="lightboxDescription" style="display: none;">
                        <h4>${title}</h4>
                        <p>${description}</p>
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="lightbox-title">${title}</div>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Animazione di apertura
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
};

window.closeLightbox = function() {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

window.toggleLightboxDescription = function() {
    const descriptionDiv = document.getElementById('lightboxDescription');
    const discoverBtn = document.querySelector('.lightbox-discover-btn');
    
    if (descriptionDiv && discoverBtn) {
        console.log('🔘 Toggle description clicked');
        
        const isHidden = descriptionDiv.style.display === 'none';
        
        if (isHidden) {
            descriptionDiv.style.display = 'block';
            discoverBtn.textContent = 'Nascondi';
            console.log('📖 Showing description');
        } else {
            descriptionDiv.style.display = 'none';
            discoverBtn.textContent = 'Scopri di più';
            console.log('🫥 Hiding description');
        }
    }
};

// === MAIN APP CLASS ===
class DonatoPastrelloWebsite {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚁 Donato Pastrello Website - Final Version');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
        
        window.addEventListener('scroll', () => this.onScroll());
        window.addEventListener('resize', () => this.onResize());
    }
    
    onDOMReady() {
        this.initNavigation();
        this.initPortfolio();
        this.initContactForm();
        this.initBackToTop();
        this.initAnimations();
        
        // Carica dati da Strapi
        this.loadStrapiData();

        // Nascondi portfolio all'avvio
        this.hidePortfolioOnStartup();
    }
    
    // === CARICAMENTO DATI STRAPI ===
    async loadStrapiData() {
        console.log('📡 Loading data from Strapi...');
        
        try {
            // Carica Site Settings
            const response = await fetch('http://localhost:1337/api/site-setting');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Site settings loaded:', data);
                this.applySiteSettings(data.data);
            } else {
                console.warn('⚠️ Could not load site settings, using defaults');
            }
            
        } catch (error) {
            console.warn('⚠️ Strapi not available, using default content');
        }
        
         // NUOVA RIGA AGGIUNTA ⬇️
        await this.loadSectionSettings();

        // Carica portfolio
        await this.loadPortfolioData();
        
        // Carica blog
        await this.loadBlogData();

        // Carica categorie portfolio  
        await this.loadPortfolioCategories();  
    }
    
    applySiteSettings(settings) {
        const { attributes } = settings;
        
        // Aggiorna hero title e subtitle
        const heroTitle = utils.select('.hero-title');
        const heroSubtitle = utils.select('.hero-subtitle');
        
        if (heroTitle && attributes.hero_title) {
            heroTitle.textContent = attributes.hero_title;
            heroTitle.style.display = 'block';
        }
        
        if (heroSubtitle && attributes.hero_subtitle) {
            heroSubtitle.textContent = attributes.hero_subtitle;
        }
        
        // Aggiorna about text
        const aboutText = utils.select('.about-description');
        if (aboutText && attributes.about_text) {
            aboutText.innerHTML = attributes.about_text;
        }
        
        // Aggiorna title pagina
        if (attributes.site_title) {
            document.title = attributes.site_title;
        }
        
        console.log('✅ Site settings applied successfully');
    }
    
    async loadPortfolioData() {
        console.log('🎨 Loading portfolio data...');
        
        try {
            const response = await fetch('http://localhost:1337/api/portfolio-items?populate=image');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Portfolio API response:', data);
                
                if (data.data && data.data.length > 0) {
                    console.log('📸 Found', data.data.length, 'portfolio items');
                    this.renderPortfolio(data.data);
                } else {
                    console.log('📭 No portfolio items found');
                }
            } else {
                console.warn('⚠️ Portfolio API failed:', response.status);
            }
            
        } catch (error) {
            console.error('❌ Portfolio loading error:', error);
        }
    }
    
    renderPortfolio(items) {
        console.log('🎨 Rendering portfolio with', items.length, 'items');
        
        const portfolioGrid = utils.select('#portfolio-grid');
        if (!portfolioGrid) {
            console.error('❌ Portfolio grid element not found');
            return;
        }
        
        // Pulisci il contenuto esistente
        portfolioGrid.innerHTML = '';
        
        items.forEach((item, index) => {
            console.log(`🖼️ Creating portfolio item ${index + 1}:`, item);
            
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.setAttribute('data-category', item.category || 'all');
            
            let imageUrl = 'https://via.placeholder.com/300x200/8D6E63/F8F4F0?text=Portfolio+Item';
            
            if (item.image && item.image.url) {
                imageUrl = `http://localhost:1337${item.image.url}`;
            }
            
            // FIX: Estrai correttamente la descrizione
            const itemTitle = item.title || 'Untitled';
            const itemDescription = item.description || '';
            
            console.log('Portfolio item data:', {
                title: itemTitle,
                description: itemDescription,
                hasImage: !!item.image,
                imageUrl: item.image?.url,
                finalUrl: imageUrl
            });
            
            portfolioItem.innerHTML = `
                <div class="portfolio-image">
                    <img src="${imageUrl}" alt="${itemTitle}" loading="lazy">
                </div>
                <div class="portfolio-overlay">
                    <h3>${itemTitle}</h3>
                    <p>${itemDescription}</p>
                    ${item.date ? `<span class="portfolio-date">${utils.formatDate(item.date)}</span>` : ''}
                </div>
            `;
            
            portfolioGrid.appendChild(portfolioItem);
            
            // Aggiungi event listener per il lightbox
            const img = portfolioItem.querySelector('img');
            img.addEventListener('click', function() {
                console.log('🖱️ Clicking image, opening lightbox with:', {
                    imageUrl: imageUrl,
                    title: itemTitle,
                    description: itemDescription
                });
                openLightbox(imageUrl, itemTitle, itemDescription);
            });
        });
        
        console.log('✅ Portfolio rendered successfully');
    }
    
    async loadBlogData() {
        console.log('📝 Loading blog data...');
        
        try {
            const response = await fetch('http://localhost:1337/api/blog-posts?populate=featured_image');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Blog API response:', data);
                
                if (data.data && data.data.length > 0) {
                    console.log('📝 Found', data.data.length, 'blog posts');
                    this.renderBlog(data.data);
                } else {
                    console.log('📭 No blog posts found, showing empty message');
                    this.showEmptyBlog();
                } 
            } else {
                console.warn('⚠️ Blog API failed:', response.status);
                this.showEmptyBlog();
            }
            
        } catch (error) {
            console.error('❌ Blog loading error:', error);
            this.showEmptyBlog();
        }
     
        



    }
    
    // === CARICAMENTO CATEGORIE PORTFOLIO ===
    async loadPortfolioCategories() {
        console.log('📂 Loading portfolio categories...');
        
        try {
            const response = await fetch('http://localhost:1337/api/portfolio-categories?populate=category_image&sort=order:asc');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Categories API response:', data);
                
                if (data.data && data.data.length > 0) {
                    console.log('📂 Found', data.data.length, 'categories');
                    this.renderPortfolioCategories(data.data);
                } else {
                    console.log('📭 No categories found');
                }
            } else {
                console.warn('⚠️ Categories API failed:', response.status);
            }
            
        } catch (error) {
            console.error('❌ Categories loading error:', error);
        }
    }

    renderPortfolioCategories(categories) {
        console.log('📂 Rendering categories with', categories.length, 'items');
        
        const dynamicCategories = utils.select('#dynamic-categories');
        if (!dynamicCategories) {
            console.error('❌ Dynamic categories container not found');
            return;
        }
        
        // Pulisci il contenuto esistente
        dynamicCategories.innerHTML = '';
        
        categories.forEach((category, index) => {
            console.log(`📁 Creating category ${index + 1}:`, category.name);
            
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.setAttribute('data-filter', category.slug);
            
            // Gestisci l'immagine della categoria
            let imageUrl = 'https://via.placeholder.com/300x200/8D6E63/F8F4F0?text=Categoria';
            
            if (category.category_image && category.category_image.url) {
                imageUrl = `http://localhost:1337${category.category_image.url}`;
            }
            
            categoryCard.innerHTML = `
                <div class="category-image">
                    <img src="${imageUrl}" alt="${category.name}" loading="lazy">
                </div>
                <div class="category-overlay">
                    <h3>${category.name}</h3>
                    <p>${category.description || ''}</p>
                </div>
            `;
            
           // Aggiungi event listener per il filtro - SENZA BLOCCARE HOVER
categoryCard.style.pointerEvents = 'auto';
categoryCard.addEventListener('click', (e) => {
    e.preventDefault();
    this.handleCategoryFilter(category.slug, categoryCard);
});

// ASSICURATI CHE L'HOVER FUNZIONI
categoryCard.addEventListener('mouseenter', () => {
    const overlay = categoryCard.querySelector('.category-overlay');
    if (overlay) {
        overlay.style.opacity = '1';
        const h3 = overlay.querySelector('h3');
        const p = overlay.querySelector('p');
        if (h3) h3.style.transform = 'translateY(0)';
        if (p) p.style.transform = 'translateY(0)';
    }
});

categoryCard.addEventListener('mouseleave', () => {
    const overlay = categoryCard.querySelector('.category-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        const h3 = overlay.querySelector('h3');
        const p = overlay.querySelector('p');
        if (h3) h3.style.transform = 'translateY(30px)';
        if (p) p.style.transform = 'translateY(30px)';
    }
});
            
            dynamicCategories.appendChild(categoryCard);
        });
        
        // Aggiungi event listener per "Tutte le categorie"
        const allCategoriesCard = utils.select('.category-card[data-filter="all"]');
        if (allCategoriesCard) {
            allCategoriesCard.addEventListener('click', () => {
                this.handleCategoryFilter('all', allCategoriesCard);
            });
        }
        
        console.log('✅ Categories rendered successfully');
    }

    // === GESTIONE FILTRI CATEGORIA ===
    handleCategoryFilter(filter, clickedCard) {
        console.log('🔍 Navigating to category:', filter);
        
        if (filter === 'all') {
            // Se clicca "Visualizza tutto" -> vai alla pagina con tutte le categorie
            window.location.href = `categoria.html?categoria=all`;
        } else {
            // Se clicca una categoria specifica -> vai alla pagina di quella categoria
            window.location.href = `categoria.html?categoria=${filter}`;
        }
    }

    filterPortfolioItems(filter) {
        console.log('🔍 Filtering portfolio by:', filter);
        
        const portfolioGrid = utils.select('#portfolio-grid');
        if (!portfolioGrid) {
            console.error('❌ Portfolio grid not found');
            return;
        }
        
        // Mostra il grid del portfolio
        portfolioGrid.style.display = 'grid';
        
        const portfolioItems = utils.selectAll('.portfolio-item');
        console.log('📸 Found', portfolioItems.length, 'portfolio items to filter');
        
        portfolioItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            console.log('🏷️ Item category:', itemCategory, 'Filter:', filter);
            
            if (filter === 'all' || itemCategory === filter) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 50);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }

    // === MOSTRA TUTTO IL PORTFOLIO ===
    showAllPortfolioItems() {
        console.log('📸 Showing all portfolio items');
        
        const portfolioGrid = utils.select('#portfolio-grid');
        if (!portfolioGrid) return;
        
        portfolioGrid.style.display = 'grid';
        
        const portfolioItems = utils.selectAll('.portfolio-item');
        portfolioItems.forEach(item => {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
    }

    // === NASCONDI PORTFOLIO ALL'AVVIO ===
    hidePortfolioOnStartup() {
        console.log('🚫 Hiding portfolio on startup');
        
        const portfolioGrid = utils.select('#portfolio-grid');
        if (portfolioGrid) {
            portfolioGrid.style.display = 'none';
        }
    }
    
    renderBlog(posts) {
        console.log('📝 Rendering blog with', posts.length, 'posts');
        
        const blogGrid = utils.select('#blog-grid');
        if (!blogGrid) {
            console.error('❌ Blog grid element not found');
            return;
        }
        
        // Pulisci il contenuto esistente
        blogGrid.innerHTML = '';
        
        // Mostra solo i primi 3 post più recenti - FIX: usa DateTime o publishedAt
        const recentPosts = posts
            .sort((a, b) => new Date(b.DateTime || b.publishedAt) - new Date(a.DateTime || a.publishedAt))
            .slice(0, 3);
        
        recentPosts.forEach((post, index) => {
            // FIX: I dati sono direttamente in post, NON in post.attributes
            console.log(`📄 Creating blog post ${index + 1}:`, post.title);
            
            const blogCard = document.createElement('article');
            blogCard.className = 'blog-card';
            
            // FIX: featured_image è un oggetto diretto con .url
            let imageUrl = 'https://via.placeholder.com/300x200/8D6E63/F8F4F0?text=Blog+Post';
            
            if (post.featured_image && post.featured_image.url) {
                imageUrl = `http://localhost:1337${post.featured_image.url}`;
            }
            
            // FIX: Usa DateTime o publishedAt per la data
            const publishDate = post.DateTime || post.publishedAt;
            
            blogCard.innerHTML = `
                <div class="blog-image">
                    <img src="${imageUrl}" alt="${post.title || 'Blog post'}" loading="lazy">
                </div>
                <div class="blog-content">
                    <h3 class="blog-title">${post.title || 'Untitled'}</h3>
                    <p class="blog-excerpt">${post.excerpt || ''}</p>
                    ${publishDate ? `<time class="blog-date">${utils.formatDate(publishDate)}</time>` : ''}
                </div>
            `;
            
            blogGrid.appendChild(blogCard);
        });
        
        console.log('✅ Blog rendered successfully');
    }
    
    showEmptyBlog() {
        console.log('📭 Showing empty blog message');
        
        const blogGrid = utils.select('#blog-grid');
        if (!blogGrid) return;
        
        blogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-brown-medium); font-style: italic;">
                <h3 style="margin-bottom: 1rem;">Blog in arrivo</h3>
                <p>Presto condividerò consigli, tutorial e storie dal mondo della fotografia con drone.</p>
            </div>
        `;
    }
    
   // === NAVIGATION MIGLIORATA ===
   initNavigation() {
    const hamburger = utils.select('#hamburger');
    const navMenu = utils.select('#nav-menu');
    const navLinks = utils.selectAll('.nav-link');
    const header = utils.select('#header');
    
    if (!hamburger || !navMenu) return;
    
    // Toggle menu hamburger
    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = hamburger.classList.contains('active');
        
        if (isActive) {
            this.closeMenu(hamburger, navMenu);
        } else {
            this.openMenu(hamburger, navMenu);
        }
    });
    
    // Click sui link del menu
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            // Chiudi menu mobile
            this.closeMenu(hamburger, navMenu);
            
            // Smooth scroll
            setTimeout(() => {
                utils.smoothScroll(target);
            }, 300);
        });
    });
    
    // Chiudi menu cliccando fuori
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && 
            !navMenu.contains(e.target) && 
            navMenu.classList.contains('active')) {
            this.closeMenu(hamburger, navMenu);
        }
    });
    
    // Chiudi menu con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            this.closeMenu(hamburger, navMenu);
        }
    });
    
    // Chiudi menu su resize se desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            this.closeMenu(hamburger, navMenu);
        }
    });
}

openMenu(hamburger, navMenu) {
    console.log('📱 Opening mobile menu');
    hamburger.classList.add('active');
    navMenu.classList.add('active');
    
    // BLOCCA COMPLETAMENTE IL BODY
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100vh';
    document.body.classList.add('menu-open');
    
    // Focus accessibility
    const firstLink = navMenu.querySelector('.nav-link');
    if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
    }
}

closeMenu(hamburger, navMenu) {
    console.log('📱 Closing mobile menu');
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    
    // RIPRISTINA IL BODY
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.classList.remove('menu-open');
}
    
    // === PORTFOLIO FILTERS ===
    initPortfolio() {
        const filterBtns = utils.selectAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                // Update active button
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter items
                const portfolioItems = utils.selectAll('.portfolio-item');
                portfolioItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');
                    
                    if (filter === 'all' || itemCategory === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // === CONTACT FORM ===
    initContactForm() {
        const form = utils.select('#contact-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject') || 'Messaggio dal sito',
                message: formData.get('message'),
                read: false,
                replied: false
            };
            
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Invio in corso...';
                submitBtn.disabled = true;
                
                const response = await fetch('http://localhost:1337/api/contact-messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data })
                });
                
                if (response.ok) {
                    this.showNotification('Messaggio inviato con successo!', 'success');
                    form.reset();
                } else {
                    throw new Error('Errore invio');
                }
                
            } catch (error) {
                this.showNotification('Errore nell\'invio. Riprova più tardi.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // === NOTIFICATIONS ===
    showNotification(message, type = 'info') {
        const existing = utils.select('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => notification.remove(), 5000);
    }
    
    // === SCROLL EFFECTS ===
    onScroll() {
        // Header scroll effect
        const header = utils.select('#header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 100);
        }
        
        // Back to top button
        const backToTop = utils.select('#back-to-top');
        if (backToTop) {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        }
        
        // Active nav link
        this.updateActiveNavLink();
    }
    
    updateActiveNavLink() {
        const sections = utils.selectAll('section[id]');
        const navLinks = utils.selectAll('.nav-link');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    // === BACK TO TOP ===
    initBackToTop() {
        const backToTop = utils.select('#back-to-top');
        if (!backToTop) return;
        
        backToTop.addEventListener('click', () => {
            utils.smoothScroll('#home');
        });
    }
    
    // === ANIMATIONS ===
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        const animatedElements = utils.selectAll('.service-card, .blog-card, .social-card, .portfolio-item');
        animatedElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }
    
    // === RESPONSIVE HANDLING ===
    onResize() {
        const hamburger = utils.select('#hamburger');
        const navMenu = utils.select('#nav-menu');
        
        if (window.innerWidth > 768) {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
// === CARICAMENTO SEZIONI DINAMICHE ===
async loadSectionSettings() {
    console.log('📋 Loading section settings...');
    
    try {
        const response = await fetch('http://localhost:1337/api/section-settings?sort=order:asc');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Section settings loaded:', data);
            this.applySectionSettings(data.data);
        } else {
            console.warn('⚠️ Could not load section settings, using defaults');
        }
        
    } catch (error) {
        console.warn('⚠️ Section settings not available:', error);
    }
}

applySectionSettings(sections) {
    console.log('🔧 Applying section settings...');
    
    sections.forEach(section => {
        const sectionElement = document.getElementById(section.section_name);
        const navLink = document.querySelector(`a[href="#${section.section_name}"]`);
        
        console.log(`📋 Processing section: ${section.section_name}, visible: ${section.is_visible}`);
        
        // Nascondi/mostra sezione
        if (sectionElement) {
            sectionElement.style.display = section.is_visible ? 'block' : 'none';
            console.log(`✅ Section ${section.section_name} set to ${section.is_visible ? 'visible' : 'hidden'}`);
        }
        
        // Nascondi/mostra link nav
        if (navLink && navLink.parentElement) {
            navLink.parentElement.style.display = section.is_visible ? 'block' : 'none';
            console.log(`✅ Nav link ${section.section_name} set to ${section.is_visible ? 'visible' : 'hidden'}`);
        }
        
        // Aggiorna contenuti se visibile
        if (section.is_visible && sectionElement) {
            this.updateSectionContent(section, sectionElement);
        }
    });
    
    console.log('✅ Section settings applied successfully');
}

updateSectionContent(section, element) {
    console.log(`🎨 Updating content for section: ${section.section_name}`);
    
    // Aggiorna titolo principale
    const titleElement = element.querySelector('.section-title, .hero-title, h1, h2');
    if (titleElement && section.title) {
        titleElement.textContent = section.title;
        console.log(`📝 Updated title: ${section.title}`);
    }
    
    // Aggiorna sottotitolo
    const subtitleElement = element.querySelector('.hero-subtitle, .section-subtitle, .category-description');
    if (subtitleElement && section.subtitle) {
        subtitleElement.textContent = section.subtitle;
        console.log(`📝 Updated subtitle: ${section.subtitle}`);
    }
    
    // Aggiorna contenuto rich text
    const contentElement = element.querySelector('.section-content, .about-description');
    if (contentElement && section.content) {
        contentElement.innerHTML = section.content;
        console.log(`📝 Updated content`);
    }
    
    // Aggiorna bottoni
    const buttonElement = element.querySelector('.cta-button, .section-button, .btn');
    if (buttonElement && section.button_text) {
        buttonElement.textContent = section.button_text;
        if (section.button_link) {
            buttonElement.setAttribute('href', section.button_link);
        }
        console.log(`🔘 Updated button: ${section.button_text}`);
    }
    
    // Aggiorna bottoni "Scopri di più" nella sezione About
    if (section.section_name === 'about') {
        this.updateAboutSection(section, element);
    }
}

updateAboutSection(section, element) {
    console.log('👤 Updating About section with dynamic content...');
    
    // Cerca se esiste già un bottone, altrimenti crealo
    let discoverButton = element.querySelector('.discover-more-btn');
    
    if (section.button_text && section.button_link) {
        if (!discoverButton) {
            // Crea il bottone se non esiste
            const aboutText = element.querySelector('.about-text');
            if (aboutText) {
                discoverButton = document.createElement('a');
                discoverButton.className = 'discover-more-btn';
                discoverButton.style.cssText = `
                    display: inline-block;
                    margin-top: 1.5rem;
                    padding: 12px 24px;
                    background: var(--color-brown-medium);
                    color: var(--color-cream);
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                `;
                
                // Hover effect
                discoverButton.addEventListener('mouseenter', () => {
                    discoverButton.style.background = 'var(--color-brown-dark)';
                    discoverButton.style.transform = 'translateY(-2px)';
                });
                
                discoverButton.addEventListener('mouseleave', () => {
                    discoverButton.style.background = 'var(--color-brown-medium)';
                    discoverButton.style.transform = 'translateY(0)';
                });
                
                aboutText.appendChild(discoverButton);
            }
        }
        
        if (discoverButton) {
            discoverButton.textContent = section.button_text;
            discoverButton.href = section.button_link;
            discoverButton.style.display = 'inline-block';
        }
    } else if (discoverButton) {
        // Nascondi il bottone se non ci sono dati
        discoverButton.style.display = 'none';
    }
}

}

// === CSS LIGHTBOX COMPLETO ===
const lightboxStyles = `
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .lightbox.active {
        opacity: 1;
        visibility: visible;
    }
    
    .lightbox-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        cursor: pointer;
    }
    
    .lightbox-content {
        position: relative;
        max-width: 95vw;
        max-height: 95vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10001;
    }
    
    .lightbox-close {
        position: absolute;
        top: -60px;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        font-size: 2rem;
        cursor: pointer;
        padding: 12px;
        z-index: 10002;
        transition: all 0.3s ease;
        border-radius: 50%;
        width: 55px;
        height: 55px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    }
    
    .lightbox-close:hover {
        background: rgba(0, 0, 0, 1);
        border-color: rgba(255, 255, 255, 0.6);
        transform: scale(1.1);
    }
    
    .lightbox-image-container {
        position: relative;
        display: inline-block;
    }
    
    .lightbox-image {
        max-width: 90vw;
        max-height: 80vh;
        min-width: 700px;
        min-height: 450px;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 15px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
    }
    
    .lightbox-info {
        position: absolute;
        bottom: 20px;
        left: 20px;
        z-index: 10003;
        max-width: 400px;
    }
    
    .lightbox-discover-btn {
        background: rgba(78, 52, 46, 0.95);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 30px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.3s ease;
        backdrop-filter: blur(15px);
        margin-bottom: 12px;
        display: block;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .lightbox-discover-btn:hover {
        background: rgba(78, 52, 46, 1);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
    }
    
    .lightbox-description {
        background: rgba(0, 0, 0, 0.92);
        color: white;
        padding: 25px;
        border-radius: 20px;
        backdrop-filter: blur(20px);
        max-width: 400px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }
    
    .lightbox-description h4 {
        margin: 0 0 15px 0;
        font-size: 1.3rem;
        color: white;
        font-weight: 700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    }
    
    .lightbox-description p {
        margin: 0;
        font-size: 1rem;
        line-height: 1.7;
        color: rgba(255,255,255,0.95);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
    }
    
    .lightbox-title {
        color: white;
        font-family: var(--font-primary);
        font-size: 1.4rem;
        font-weight: 600;
        margin-top: 30px;
        text-align: center;
        max-width: 600px;
        text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.4);
        padding: 18px 30px;
        border-radius: 30px;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    @media (max-width: 1024px) {
        .lightbox-image {
            min-width: 500px;
            min-height: 300px;
            max-height: 75vh;
        }
    }
    
    @media (max-width: 768px) {
        .lightbox-content {
            max-width: 95vw;
            max-height: 95vh;
        }
        
        .lightbox-close {
            top: -50px;
            right: -5px;
            font-size: 1.6rem;
            width: 50px;
            height: 50px;
            padding: 10px;
        }
        
        .lightbox-image {
            max-height: 70vh;
            min-width: 300px;
            min-height: 200px;
        }
        
        .lightbox-title {
            font-size: 1.2rem;
            margin-top: 25px;
            padding: 15px 25px;
        }
        
        .lightbox-info {
            bottom: 15px;
            left: 15px;
            max-width: 300px;
        }
        
        .lightbox-discover-btn {
            padding: 12px 24px;
            font-size: 0.95rem;
        }
        
        .lightbox-description {
            padding: 20px;
            max-width: 300px;
        }
        
        .lightbox-description h4 {
            font-size: 1.15rem;
        }
        
        .lightbox-description p {
            font-size: 0.95rem;
            line-height: 1.6;
        }
    }
    
    @media (max-width: 480px) {
        .lightbox-image {
            min-width: 280px;
            min-height: 180px;
            max-height: 65vh;
        }
        
        .lightbox-info {
            max-width: 260px;
        }
        
        .lightbox-description {
            max-width: 260px;
            padding: 16px;
        }
        
        .lightbox-discover-btn {
            padding: 10px 20px;
            font-size: 0.9rem;
        }
    }
`;

// === CSS AGGIUNTIVO ===
const additionalStyles = `
    .portfolio-item {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        background: var(--color-beige);
        border-radius: var(--radius-md);
        height: 250px;
        transition: all 0.3s ease;
    }
    
    .portfolio-item:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-medium);
    }
    
    .portfolio-image {
        width: 100%;
        height: 100%;
    }
    
    .portfolio-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
        cursor: pointer;
    }
    
    .portfolio-item:hover .portfolio-image img {
        transform: scale(1.05);
    }
    
    .portfolio-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(78, 52, 46, 0.8);
        color: var(--color-cream);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 1rem;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .portfolio-item:hover .portfolio-overlay {
        opacity: 1;
    }
    
    .blog-card {
        cursor: pointer;
        transition: transform 0.3s ease;
        background: var(--color-white);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-light);
    }
    
    .blog-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-medium);
    }
    
    .blog-image {
        height: 200px;
        overflow: hidden;
    }
    
    .blog-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .blog-content {
        padding: var(--spacing-md);
    }
    
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #4caf50;
    }
    
    .notification-error {
        border-left: 4px solid #f44336;
    }
    
    .notification button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    .hero-title {
        display: block !important;
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
        }
        
        .portfolio-overlay {
            opacity: 1;
            background: rgba(78, 52, 46, 0.6);
        }
        
        .portfolio-item {
            height: 200px;
        }
        
        .blog-image {
            height: 150px;
        }
    }
    
    /* Miglioramenti accessibilità */
    .lightbox-discover-btn:focus,
    .lightbox-close:focus {
        outline: 3px solid rgba(255, 255, 255, 0.8);
        outline-offset: 3px;
    }
    
    /* Smooth scroll per tutto */
    html {
        scroll-behavior: smooth;
    }
    
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
        
        html {
            scroll-behavior: auto;
        }
    }
`;

// Inject all styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles + lightboxStyles;
document.head.appendChild(styleSheet);

// Gestione tasto ESC per chiudere lightbox
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (typeof closeLightbox === 'function') {
            closeLightbox();
        }
    }
});

// === INITIALIZE APP ===
console.log('🚀 Starting Donato Pastrello Website...');
const app = new DonatoPastrelloWebsite();

console.log('✅ Website initialized successfully');