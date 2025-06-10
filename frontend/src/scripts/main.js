/**
 * DONATO PASTRELLO WEBSITE - VERSIONE SICURA E PULITA
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
    
    const existingLightbox = document.querySelector('.lightbox');
    if (existingLightbox) {
        existingLightbox.remove();
    }
    
    const hasDescription = description && description.trim() !== '' && description !== 'undefined';
    
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
        const isHidden = descriptionDiv.style.display === 'none';
        
        if (isHidden) {
            descriptionDiv.style.display = 'block';
            discoverBtn.textContent = 'Nascondi';
        } else {
            descriptionDiv.style.display = 'none';
            discoverBtn.textContent = 'Scopri di più';
        }
    }
};

// === MAIN APP CLASS ===
class DonatoPastrelloWebsite {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚁 Donato Pastrello Website - Clean Version');
        
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

        // Carica social links
        this.loadSocialLinks();
    }
    
    // === CARICAMENTO DATI STRAPI ===
    async loadStrapiData() {
        console.log('📡 Loading data from Strapi...');
        
        try {
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
        
        // Carica sezioni dinamiche
        await this.loadSectionSettings();
        
        // Carica portfolio
        await this.loadPortfolioData();
        
        // Carica blog
        await this.loadBlogData();

        // Carica categorie portfolio  
        await this.loadPortfolioCategories();  
    }
    
    // === CARICAMENTO SEZIONI DINAMICHE ===
 async loadSectionSettings() {
    console.log('📋 Loading section settings...');
    
    try {
        // AGGIUNGI populate=section_image per caricare anche le immagini
        const response = await fetch('http://localhost:1337/api/section-settings?sort=order:asc&populate=section_image');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Section settings loaded:', data);
            console.log('🔍 ABOUT SECTION DETAILED:', data.data.find(s => s.section_name === 'about'));
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
            }
            
            // Nascondi/mostra link nav
            if (navLink && navLink.parentElement) {
                navLink.parentElement.style.display = section.is_visible ? 'block' : 'none';
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
    }
    
    // Aggiorna sottotitolo
    const subtitleElement = element.querySelector('.hero-subtitle, .section-subtitle');
    if (subtitleElement && section.subtitle) {
        subtitleElement.textContent = section.subtitle;
    }
    
    // Aggiorna contenuto principale (CHI SONO)



    if (section.section_name === 'about') {
        const aboutDescription = element.querySelector('.about-description');
        if (aboutDescription && section.content) {
            aboutDescription.innerHTML = section.content;
        }

        // Aggiorna immagine da Strapi
        const aboutImg = element.querySelector('.about-img');
        if (aboutImg && section.section_image && section.section_image.url) {
         aboutImg.src = `http://localhost:1337${section.section_image.url}`;
         aboutImg.alt = section.section_image.alternativeText || 'Donato Pastrello';
        console.log('✅ About image loaded from Strapi:', section.section_image.url);
}
        
        // Aggiungi bottone se presente
        if (section.button_text) {
            this.addAboutButton(section, element);
        }



        
    } else {
        // Per altre sezioni
        const contentElement = element.querySelector('.section-content');
        if (contentElement && section.content) {
            contentElement.innerHTML = section.content;
        }
    }
}

    addAboutButton(section, element) {
        console.log('🔘 Adding About button...');
        
        const aboutText = element.querySelector('.about-text');
        if (!aboutText) return;
        
        // Rimuovi bottone esistente
        const existingBtn = aboutText.querySelector('.about-btn');
        if (existingBtn) existingBtn.remove();
        
        // Crea nuovo bottone
        const button = document.createElement('a');
        button.className = 'about-btn';
        button.textContent = section.button_text;
        button.href = '#';
        
        // Stile semplice
        button.style.display = 'inline-block';
        button.style.marginTop = '1.5rem';
        button.style.padding = '12px 24px';
        button.style.backgroundColor = '#8D6E63';
        button.style.color = '#F8F4F0';
        button.style.textDecoration = 'none';
        button.style.borderRadius = '25px';
        button.style.fontWeight = '500';
        button.style.cursor = 'pointer';
        
      // Click handler
button.addEventListener('click', (e) => {
    e.preventDefault();
    this.showAboutDetailedPage();
});
         aboutText.appendChild(button);
        console.log('✅ About button added');


        
    }
    
    applySiteSettings(settings) {
        const { attributes } = settings;
        
        const heroTitle = utils.select('.hero-title');
        const heroSubtitle = utils.select('.hero-subtitle');
        
        if (heroTitle && attributes.hero_title) {
            heroTitle.textContent = attributes.hero_title;
            heroTitle.style.display = 'block';
        }
        
        if (heroSubtitle && attributes.hero_subtitle) {
            heroSubtitle.textContent = attributes.hero_subtitle;
        }
        
        const aboutText = utils.select('.about-description');
        if (aboutText && attributes.about_text) {
            aboutText.innerHTML = attributes.about_text;
        }
        
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
                    this.renderPortfolio(data.data);
                }
            }
        } catch (error) {
            console.error('❌ Portfolio loading error:', error);
        }
    }
    
    renderPortfolio(items) {
        console.log('🎨 Rendering portfolio with', items.length, 'items');
        
        const portfolioGrid = utils.select('#portfolio-grid');
        if (!portfolioGrid) return;
        
        portfolioGrid.innerHTML = '';
        
        items.forEach((item) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.setAttribute('data-category', item.category || 'all');
            
            let imageUrl = 'https://via.placeholder.com/300x200/8D6E63/F8F4F0?text=Portfolio+Item';
            
            if (item.image && item.image.url) {
                imageUrl = `http://localhost:1337${item.image.url}`;
            }
            
            const itemTitle = item.title || 'Untitled';
            const itemDescription = item.description || '';
            
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
            
            const img = portfolioItem.querySelector('img');
            img.addEventListener('click', function() {
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
                
                if (data.data && data.data.length > 0) {
                    this.renderBlog(data.data);
                } else {
                    this.showEmptyBlog();
                } 
            } else {
                this.showEmptyBlog();
            }
        } catch (error) {
            this.showEmptyBlog();
        }
    }
 
    
    
async loadSocialLinks() {
    console.log('📱 Loading social links...');
    
    try {
        const response = await fetch('http://localhost:1337/api/social-links?sort=order:asc&populate=platform_icon&filters[is_visible][$eq]=true');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Social links loaded:', data);
            
            if (data.data && data.data.length > 0) {
                this.renderSocialLinks(data.data);
            }
        }
    } catch (error) {
        console.warn('⚠️ Social links not available:', error);
    }
}

renderSocialLinks(socialLinks) {
    console.log('🎨 Rendering social links with modern design...');
    
    const socialGrid = utils.select('.social-grid');
    if (!socialGrid) return;
    
    // Pulisci contenuto esistente
    socialGrid.innerHTML = '';
    
    socialLinks.forEach((social) => {
        const socialCard = document.createElement('div');
        socialCard.className = 'social-card-modern';
        
        let iconUrl = 'https://via.placeholder.com/64x64/8D6E63/FFFFFF?text=?';
        if (social.platform_icon && social.platform_icon.url) {
            iconUrl = `http://localhost:1337${social.platform_icon.url}`;
        }
        
        const platformColor = social.platform_color || '#8D6E63';
        
        socialCard.innerHTML = `
            <div class="social-icon-container">
                <img src="${iconUrl}" alt="${social.platform_name}" class="social-icon-img">
            </div>
            <div class="social-info">
                <h3 class="social-platform-name">${social.platform_name}</h3>
                <p class="social-description">${social.description || ''}</p>
            </div>
        `;
        
        // Applica colore dinamico
        socialCard.style.setProperty('--social-color', platformColor);
        
        // Aggiungi click handler
        socialCard.addEventListener('click', () => {
            window.open(social.platform_url, '_blank', 'noopener,noreferrer');
        });
        
        socialCard.style.cursor = 'pointer';
        
        socialGrid.appendChild(socialCard);
    });
}


    async loadPortfolioCategories() {
        console.log('📂 Loading portfolio categories...');
        
        try {
            const response = await fetch('http://localhost:1337/api/portfolio-categories?populate=category_image&sort=order:asc');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.data && data.data.length > 0) {
                    this.renderPortfolioCategories(data.data);
                }
            }
        } catch (error) {
            console.error('❌ Categories loading error:', error);
        }
    }

    renderPortfolioCategories(categories) {
        console.log('📂 Rendering categories with', categories.length, 'items');
        
        const dynamicCategories = utils.select('#dynamic-categories');
        if (!dynamicCategories) return;
        
        dynamicCategories.innerHTML = '';
        
        categories.forEach((category) => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.setAttribute('data-filter', category.slug);
            
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
            
            categoryCard.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryFilter(category.slug, categoryCard);
            });
            
            dynamicCategories.appendChild(categoryCard);
        });
        
        console.log('✅ Categories rendered successfully');
    }

    handleCategoryFilter(filter, clickedCard) {
        console.log('🔍 Navigating to category:', filter);
        
        if (filter === 'all') {
            window.location.href = `categoria.html?categoria=all`;
        } else {
            window.location.href = `categoria.html?categoria=${filter}`;
        }
    }

   renderBlog(posts) {
    const blogGrid = utils.select('#blog-grid');
    if (!blogGrid) return;
    
    blogGrid.innerHTML = '';
    
    const recentPosts = posts
        .sort((a, b) => new Date(b.DateTime || b.publishedAt) - new Date(a.DateTime || a.publishedAt))
        .slice(0, 5);
    
    recentPosts.forEach((post) => {
        const blogCard = document.createElement('article');
        blogCard.className = 'blog-card';
        
        let imageUrl = 'https://via.placeholder.com/400x250/8D6E63/F8F4F0?text=Blog+Post';
        
        if (post.featured_image && post.featured_image.url) {
            imageUrl = `http://localhost:1337${post.featured_image.url}`;
        }
        
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
        
        // Aggiungi click handler per aprire articolo completo
        blogCard.addEventListener('click', () => {
            this.openBlogPost(post);
        });
        
        blogCard.style.cursor = 'pointer';
        
        blogGrid.appendChild(blogCard);
    });
}
    
openBlogPost(post) {
    console.log('📖 Opening blog post:', post.title);
    
    let imageUrl = '';
    if (post.featured_image && post.featured_image.url) {
        imageUrl = `http://localhost:1337${post.featured_image.url}`;
    }
    
    const publishDate = post.DateTime || post.publishedAt;
    const formattedDate = publishDate ? utils.formatDate(publishDate) : '';
    
    // Crea overlay per articolo completo
    const overlay = document.createElement('div');
    overlay.className = 'blog-post-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(248, 244, 240, 0.98);
        z-index: 10000;
        overflow-y: auto;
        padding: 100px 20px 50px;
        opacity: 0;
        transition: opacity 0.4s ease;
    `;
    
    overlay.innerHTML = `
        <div class="blog-post-content" style="
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 3rem;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(78, 52, 46, 0.2);
            position: relative;
        ">
            <button class="close-blog-post" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: #8D6E63;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            ">&times;</button>
            
            ${imageUrl ? `
                <div class="blog-post-image" style="
                    width: 100%;
                    height: 400px;
                    margin-bottom: 2.5rem;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(78, 52, 46, 0.15);
                ">
                    <img src="${imageUrl}" alt="${post.title}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        object-position: center;
                    ">
                </div>
            ` : ''}
            
            <div class="blog-post-header" style="margin-bottom: 2rem;">
                <h1 style="
                    color: #4E342E; 
                    margin-bottom: 1rem; 
                    font-size: 2.5rem;
                    line-height: 1.2;
                ">${post.title || 'Untitled'}</h1>
                
                ${formattedDate ? `
                    <time style="
                        color: #8D6E63;
                        font-size: 1rem;
                        font-style: italic;
                    ">${formattedDate}</time>
                ` : ''}
            </div>
            
            <div class="blog-post-body" style="
                font-size: 1.1rem;
                line-height: 1.8;
                color: #4E342E;
            ">
                ${post.content || post.excerpt || '<p>Contenuto non disponibile.</p>'}
            </div>
            
            <div style="text-align: center; margin-top: 3rem;">
                <button class="close-blog-btn" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background: #8D6E63;
                    color: #F8F4F0;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">
                    Chiudi Articolo
                </button>
            </div>
        </div>
    `;
    
    // Aggiungi al DOM
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Animazione di entrata
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    // Event listeners
    const closeBtn = overlay.querySelector('.close-blog-post');
    const closeBlogBtn = overlay.querySelector('.close-blog-btn');
    
    // Hover effects
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#BCAAA4';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
    });
    
    closeBlogBtn.addEventListener('mouseenter', () => {
        closeBlogBtn.style.background = '#4E342E';
        closeBlogBtn.style.transform = 'translateY(-2px)';
    });
    closeBlogBtn.addEventListener('mouseleave', () => {
        closeBlogBtn.style.background = '#8D6E63';
        closeBlogBtn.style.transform = 'translateY(0)';
    });
    
    // Close handlers
    const closeFunction = () => this.closeBlogPost(overlay);
    
    closeBtn.addEventListener('click', closeFunction);
    closeBlogBtn.addEventListener('click', closeFunction);
    
    // Chiudi con ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeFunction();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Chiudi cliccando fuori
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeFunction();
        }
    });
}

closeBlogPost(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
    }, 400);
}


    showEmptyBlog() {
        const blogGrid = utils.select('#blog-grid');
        if (!blogGrid) return;
        
        blogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-brown-medium); font-style: italic;">
                <h3 style="margin-bottom: 1rem;">Blog in arrivo</h3>
                <p>Presto condividerò consigli, tutorial e storie dal mondo della fotografia con drone.</p>
            </div>
        `;
    }
    
    hidePortfolioOnStartup() {
        const portfolioGrid = utils.select('#portfolio-grid');
        if (portfolioGrid) {
            portfolioGrid.style.display = 'none';
        }
    }
    
    // === NAVIGATION ===
    initNavigation() {
        const hamburger = utils.select('#hamburger');
        const navMenu = utils.select('#nav-menu');
        const navLinks = utils.selectAll('.nav-link');
        
        if (!hamburger || !navMenu) return;
        
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
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                
                this.closeMenu(hamburger, navMenu);
                
                setTimeout(() => {
                    utils.smoothScroll(target);
                }, 300);
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && 
                !navMenu.contains(e.target) && 
                navMenu.classList.contains('active')) {
                this.closeMenu(hamburger, navMenu);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                this.closeMenu(hamburger, navMenu);
            }
        });
        
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
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
    }
    
    closeMenu(hamburger, navMenu) {
        console.log('📱 Closing mobile menu');
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    }
    
    // === PORTFOLIO FILTERS ===
    initPortfolio() {
        const filterBtns = utils.selectAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
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
    
    onScroll() {
        const header = utils.select('#header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 100);
        }
        
        const backToTop = utils.select('#back-to-top');
        if (backToTop) {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        }
        
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
    
    initBackToTop() {
        const backToTop = utils.select('#back-to-top');
        if (!backToTop) return;
        
        backToTop.addEventListener('click', () => {
            utils.smoothScroll('#home');
        });
    }
    
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
    
    onResize() {
        const hamburger = utils.select('#hamburger');
        const navMenu = utils.select('#nav-menu');
        
        if (window.innerWidth > 768) {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }



showAboutDetailedPage() {
    console.log('📖 Showing detailed about page from Strapi');
    
    // Recupera i dati about da Strapi
    this.loadAboutDetailedContent();
}

async loadAboutDetailedContent() {
    try {
        const response = await fetch('http://localhost:1337/api/section-settings?filters[section_name][$eq]=about');
        const data = await response.json();
        
        let detailedContent = `
            <h1 style="color: #4E342E; margin-bottom: 2rem; font-size: 2.5rem;">
                La Mia Storia
            </h1>
            <div style="font-size: 1.1rem; line-height: 1.7; color: #8D6E63;">
                <p>Contenuto non disponibile. Verifica la configurazione di Strapi.</p>
            </div>
        `;
        
        // Se abbiamo dati da Strapi, usali
        if (data.data && data.data.length > 0) {
            const aboutSection = data.data[0];
            if (aboutSection.detailed_content) {
                detailedContent = `
                    <div style="font-size: 1.1rem; line-height: 1.7; color: #8D6E63;">
                        ${aboutSection.detailed_content}
                    </div>
                `;
            }
        }
        
        this.displayAboutDetailedOverlay(detailedContent);
        
    } catch (error) {
        console.error('Errore caricamento contenuto dettagliato:', error);
        // Fallback al contenuto hardcoded
        this.displayAboutDetailedOverlay(`
            <h1 style="color: #4E342E; margin-bottom: 2rem; font-size: 2.5rem;">
                La Mia Storia
            </h1>
            <div style="font-size: 1.1rem; line-height: 1.7; color: #8D6E63;">
                <p>Errore nel caricamento. Controlla la connessione a Strapi.</p>
            </div>
        `);
    }
}

displayAboutDetailedOverlay(content) {
    // Crea overlay per pagina dettagliata
    const overlay = document.createElement('div');
    overlay.className = 'about-detailed-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(248, 244, 240, 0.98);
        z-index: 10000;
        overflow-y: auto;
        padding: 100px 20px 50px;
        opacity: 0;
        transition: opacity 0.4s ease;
    `;
    
    overlay.innerHTML = `
        <div class="about-detailed-content" style="
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 3rem;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(78, 52, 46, 0.2);
            position: relative;
        ">
            <button class="close-detailed" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: #8D6E63;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            ">&times;</button>
            
            ${content}
            
            <div style="text-align: center; margin-top: 2rem;">
                <a href="#contact" class="contact-cta" style="
                    display: inline-block;
                    padding: 15px 30px;
                    background: #8D6E63;
                    color: #F8F4F0;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">
                    Contattami per il tuo progetto
                </a>
            </div>
        </div>
    `;
    
    // Aggiungi al DOM
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Animazione di entrata
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    // Event listeners
    const closeBtn = overlay.querySelector('.close-detailed');
    const contactCta = overlay.querySelector('.contact-cta');
    
    // Hover effects
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#BCAAA4';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
    });
    
    contactCta.addEventListener('mouseenter', () => {
        contactCta.style.background = '#4E342E';
        contactCta.style.transform = 'translateY(-2px)';
    });
    contactCta.addEventListener('mouseleave', () => {
        contactCta.style.background = '#8D6E63';
        contactCta.style.transform = 'translateY(0)';
    });
    
    // Close handlers
    closeBtn.addEventListener('click', () => {
        this.closeAboutDetailed(overlay);
    });
    
    contactCta.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAboutDetailed(overlay);
        setTimeout(() => {
            utils.smoothScroll('#contact');
        }, 400);
    });
    
    // Chiudi con ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            this.closeAboutDetailed(overlay);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Chiudi cliccando fuori
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            this.closeAboutDetailed(overlay);
        }
    });
}

    closeAboutDetailed(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 400);
    }

}

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