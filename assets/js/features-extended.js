// ========== STOCK PRODUITS ==========
const productStock = {
  'yogurt-banane': 15,
  'yogurt-fraise': 12,
  'yogurt-vanille': 18,
  'yogurt-coco': 10
};

function getStock(productId) {
  return productStock[productId] || 0;
}

// ========== MODE SOMBRE ==========
function initDarkMode() {
}

// ========== CAROUSEL HÉROS ==========
const heroImages = [
  'assets/images/WhatsApp Image 2026-01-06 at 17.20.58.jpeg',
  'assets/images/yaourt maison.png',
  'assets/images/Fraise_Plan de travail 1.jpg'
];

let heroIndex = 0;

window.nextHeroSlide = function() {
  heroIndex = (heroIndex + 1) % heroImages.length;
  updateHeroCarousel();
};

window.prevHeroSlide = function() {
  heroIndex = (heroIndex - 1 + heroImages.length) % heroImages.length;
  updateHeroCarousel();
};

function updateHeroCarousel() {
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.backgroundImage = `url('${heroImages[heroIndex]}')`;
  }
  updateCarouselDots();
}

function updateCarouselDots() {
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, idx) => {
    if (idx === heroIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function initHeroCarousel() {
  updateHeroCarousel();
  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroImages.length;
    updateHeroCarousel();
  }, 5000);
}

// ========== FILTRE & TRI PRODUITS ==========
window.filterAndSortProducts = function(flavor = 'all', sort = 'default') {
  const products = [
    { id: 'yogurt-banane', name: 'Yaourt Banane', price: 450, image: 'yaourt%20banane.jpeg', flavor: 'banane' },
    { id: 'yogurt-fraise', name: 'Yaourt Fraise', price: 450, image: 'yaourt%20fraise%20.png', flavor: 'fraise' },
    { id: 'yogurt-vanille', name: 'Yaourt à la Vanille', price: 450, image: 'yaourt%20%C3%A0%20la%20vanille%20.png', flavor: 'vanille' },
    { id: 'yogurt-coco', name: 'Yaourt Coco', price: 450, image: 'yaourt%20%20coco.png', flavor: 'coco' }
  ];
  
  let filtered = flavor === 'all' ? products : products.filter(p => p.flavor === flavor);
  
  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'popular') filtered.sort((a, b) => getStock(b.id) - getStock(a.id));
  
  const container = document.getElementById('productsGridContainer');
  if (!container) return;
  
  container.innerHTML = '';
  filtered.forEach(p => {
    const stock = getStock(p.id);
    const isFav = isInFavorites(p.id);
    container.innerHTML += `
      <div class="product-card">
        <div class="product-img-frame">
          <img src="assets/images/${p.image}" alt="${escapeHtml(p.name)}">
        </div>
        <h4>${escapeHtml(p.name)}</h4>
        <p class="product-price">${p.price} FCFA</p>
        <p class="stock-info ${stock <= 5 ? 'low-stock' : stock === 0 ? 'out-of-stock' : ''}">
          ${stock === 0 ? '❌ Rupture' : stock <= 5 ? `⚠️ ${stock} restants` : `✓ En stock (${stock})`}
        </p>
        <div style="display:flex; gap:8px; margin-top:0.5rem;">
          <button class="btn" onclick="addToCartById('${p.id}', 1);" ${stock === 0 ? 'disabled' : ''} style="flex:1;">🛒 Ajouter</button>
          <button class="btn" onclick="addToFavorites('${p.id}');" style="flex:1; background:${isFav ? '#e74c3c' : '#d35400'};"><i class="fa-${isFav ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i></button>
        </div>
      </div>
    `;
  });
};

// ========== RECOMMANDATIONS ==========
function showRecommendations() {
  const container = document.getElementById('recommendedProducts');
  if (!container) return;
  
  const products = [
    { id: 'yogurt-banane', name: 'Yaourt Banane', price: 450, image: 'yaourt%20banane.jpeg' },
    { id: 'yogurt-fraise', name: 'Yaourt Fraise', price: 450, image: 'yaourt%20fraise%20.png' },
    { id: 'yogurt-coco', name: 'Yaourt Coco', price: 450, image: 'yaourt%20%20coco.png' }
  ];
  
  let html = '<h3 style="text-align:center; color:#d35400; margin-bottom:1rem;">Vous aimerez aussi</h3><div class="recommendations-grid">';
  products.forEach(p => {
    const stock = getStock(p.id);
    html += `
      <div class="recommendation-card">
        <img src="assets/images/${p.image}" alt="${escapeHtml(p.name)}">
        <h4>${escapeHtml(p.name)}</h4>
        <p>${p.price} FCFA</p>
        <button class="btn" onclick="addToCartById('${p.id}', 1);" ${stock === 0 ? 'disabled' : ''}>Ajouter</button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ========== HISTORIQUE COMMANDES ==========
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem('orders') || '[]');
  } catch (e) {
    return [];
  }
}

window.showOrderHistory = function() {
  const currentUser = localStorage.getItem('currentUser');
  const modal = document.getElementById('orderHistoryModal');
  if (!modal) return;

  let allOrders = getOrders();
  let guestNotice = '';

  if (!currentUser) {
    guestNotice = `<div style="background:#fff9e6; border:1px solid #d35400; padding:12px; border-radius:8px; margin-bottom:12px; color:#333;">Vous n'êtes pas connecté — mode invité. Connectez-vous pour retrouver et gérer vos commandes.</div>`;
    // Si pas de commandes sauvegardées, fournir un exemple/demo
    if (!allOrders || allOrders.length === 0) {
      allOrders = [{ id: 'DEMO-001', customer: 'Invité', total: '0 FCFA', date: new Date().toLocaleString('fr-FR'), delivered: false, items: [] }];
    }
  }

  const userOrders = allOrders; // dans cette version on affiche toutes les commandes stockées

  let html = guestNotice;
  if (userOrders.length === 0) {
    html += '<p style="text-align:center; color:#999; padding:2rem;">Aucune commande pour le moment</p>';
  } else {
    html += '<div class="orders-list">';
    userOrders.forEach(order => {
      const status = order.delivered ? '✅ Livrée' : '⏳ En attente';
      html += `
        <div class="order-card">
          <div class="order-header">
            <span class="order-id">#${order.id}</span>
            <span class="order-status">${status}</span>
          </div>
          <p><strong>Client:</strong> ${escapeHtml(order.customer || 'Invité')}</p>
          <p><strong>Total:</strong> ${order.total || '0 FCFA'}</p>
          <p><strong>Date:</strong> ${order.date || ''}</p>
          <button class="btn" onclick="reorderItems('${order.id}');">🔄 Récommander</button>
        </div>
      `;
    });
    html += '</div>';
  }

  document.getElementById('orderHistoryContent').innerHTML = html;
  modal.style.display = 'block';
};

window.reorderItems = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.items.forEach(item => {
    const product = products.find(p => p.name === item.name);
    if (product) {
      addToCartById(product.id, item.quantity);
    }
  });
  
  Swal.fire('Succès', 'Articles ajoutés au panier', 'success');
};

// ========== NEWSLETTER ==========
window.showNewsletterInfo = function() {
  Swal.fire({
    title: '📬 Notre Newsletter',
    html: '<div style="text-align: left;"><p><strong>C\'est un service gratuit où nous vous envoyons :</strong></p><ul style="text-align: left; margin: 1rem 0;"><li>✅ <strong>Nos meilleures offres</strong> et réductions exclusives</li><li>✅ <strong>Nouveaux produits</strong> et saveurs du moment</li><li>✅ <strong>20% de réduction</strong> sur votre première commande</li><li>✅ <strong>Événements spéciaux</strong> et promotions saisonnières</li></ul><p><em>Vous pouvez vous désabonner à tout moment.</em></p></div>',
    icon: 'info',
    confirmButtonColor: '#d35400',
    confirmButtonText: 'J\'ai compris'
  });
};

window.subscribeNewsletter = function() {
  const email = document.getElementById('newsletterEmail')?.value;
  if (!email || !email.includes('@')) {
    Swal.fire('Erreur', 'Veuillez entrer un email valide', 'error');
    return;
  }
  
  const subscribers = JSON.parse(localStorage.getItem('newsletter') || '[]');
  if (subscribers.includes(email)) {
    Swal.fire('Info', 'Vous êtes déjà abonné', 'info');
    return;
  }
  
  subscribers.push(email);
  localStorage.setItem('newsletter', JSON.stringify(subscribers));
  document.getElementById('newsletterEmail').value = '';
  
  Swal.fire('Succès', 'Merci ! 20% de réduction sur votre première commande', 'success');
};

// ========== AVIS AVEC FILTRAGE ==========
function getAverageRating() {
  const reviews = loadReviews();
  if (reviews.length === 0) return 0;
  return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
}

window.filterReviews = function(rating = 'all') {
  const reviews = loadReviews();
  let filtered = reviews;
  
  if (rating !== 'all') {
    const ratingNum = parseInt(rating);
    filtered = reviews.filter(r => r.rating === ratingNum);
  }
  
  const container = document.getElementById('reviewsList');
  if (!container) return;
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999;">Aucun avis avec ce filtre</p>';
    return;
  }
  
  let html = '';
  filtered.forEach((r, idx) => {
    const stars = '⭐'.repeat(r.rating);
    html += `
      <div class="review-item">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <strong>${escapeHtml(r.name)}</strong> <span style="color:#d35400;">${stars}</span>
          </div>
          <small style="color:#999;">${r.date}</small>
        </div>
        <p style="margin-top:0.5rem; color:#555;">"${escapeHtml(r.comment)}"</p>
      </div>
    `;
  });
  
  container.innerHTML = html;
};

// ========== SCROLL TO TOP ==========
window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function initScrollToTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });
}

// ========== CONFETTI ==========
function triggerConfetti() {
  const count = 50;
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.delay = Math.random() * 0.5 + 's';
    confetti.style.backgroundColor = ['#d35400', '#e67e22', '#c0392b', '#27ae60', '#3498db'][Math.floor(Math.random() * 5)];
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

// ========== SKELETON LOADING ==========
function showSkeletonLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += '<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-text"></div></div>';
  }
  container.innerHTML = html;
}

// ========== BREADCRUMB ==========
function updateBreadcrumb(path = []) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;
  
  let html = '<a href="#accueil">Accueil</a>';
  path.forEach(item => {
    html += ` / <span>${item}</span>`;
  });
  container.innerHTML = html;
}

// ========== MINI-PANIER AU SURVOL ==========
function initMiniCart() {
  const cartBtn = document.querySelector('.cart-btn');
  const miniCart = document.getElementById('miniCart');
  let isMobile = window.innerWidth <= 768;
  
  if (cartBtn && miniCart) {
    // Update on window resize
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
    });

    // Desktop: mouseenter/mouseleave
    // Mobile: click to toggle
    if (!isMobile) {
      cartBtn.addEventListener('mouseenter', () => {
        const cart = getCart();
        let html = '';
        if (cart.length === 0) {
          html = '<p style="padding:1rem; color:#999;">Panier vide</p>';
        } else {
          cart.slice(0, 3).forEach(item => {
            html += `<div style="padding:0.5rem; border-bottom:1px solid #eee;">${item.name} x${item.quantity}</div>`;
          });
          if (cart.length > 3) {
            html += `<p style="padding:0.5rem; color:#d35400; font-weight:700;">+${cart.length - 3} autre(s)</p>`;
          }
        }
        miniCart.innerHTML = html;
        miniCart.style.display = 'block';
      });

      cartBtn.addEventListener('mouseleave', () => {
        miniCart.style.display = 'none';
      });
    } else {
      // Mobile: click behavior
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cart = getCart();
        let html = '<div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid #eee;"><h3>Panier</h3><button class="miniCart-close" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#999;">×</button></div>';
        
        if (cart.length === 0) {
          html += '<p style="padding:1rem; color:#999;">Panier vide</p>';
        } else {
          cart.forEach(item => {
            html += `<div style="padding:0.8rem; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between;"><span>${item.name} x${item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)} €</span></div>`;
          });
          const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
          html += `<div style="padding:1rem; background:#f9f9f9; text-align:right; font-weight:700;">Total: ${total} €</div>`;
          html += '<button onclick="openCart()" style="width:100%; padding:0.8rem; background:#d35400; color:white; border:none; cursor:pointer; font-weight:700; border-radius:4px; margin-top:0.5rem;">Voir le panier</button>';
        }
        
        miniCart.innerHTML = html;
        miniCart.style.display = 'block';
        
        const closeBtn = document.querySelector('.miniCart-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            miniCart.style.display = 'none';
          });
        }
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!cartBtn.contains(e.target) && !miniCart.contains(e.target)) {
          miniCart.style.display = 'none';
        }
      });
    }
  }
}

// ========== WHATSAPP INTÉGRÉ ==========
window.openWhatsApp = function(message = '') {
  const phoneNumber = '242064965598';
  const defaultMsg = message || 'Bonjour, je voudrais commander des yaourts Delice Royal.';
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMsg)}`;
  window.open(url, '_blank');
// ========== MODAL YAOURTS ==========
window.openYogurtModal = function() {
  const modal = document.getElementById('yogurtModal');
  if (modal) {
    modal.style.display = 'block';
  }
};

window.closeYogurtModal = function() {
  const modal = document.getElementById('yogurtModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// ========== CONTRÔLES DE QUANTITÉ ==========
window.increaseQty = function(btn) {
  const input = btn.previousElementSibling;
  if (input && input.classList.contains('qty-input')) {
    input.value = Math.min(parseInt(input.value) + 1, 999);
  }
};

window.decreaseQty = function(btn) {
  const input = btn.nextElementSibling;
  if (input && input.classList.contains('qty-input')) {
    input.value = Math.max(parseInt(input.value) - 1, 1);
  }
};

// ========== AJOUTER AU PANIER DEPUIS MODAL YAOURTS ==========
window.addToCart = function(btn) {
  const item = btn.closest('.yogurt-item');
  if (!item) return;
  
  const idBtn = item.querySelector('.wishlist-btn');
  const productId = idBtn?.getAttribute('data-id') || 'yogurt-banane';
  const qtyInput = item.querySelector('.qty-input');
  const qty = parseInt(qtyInput?.value || 1);
  const nameEl = item.querySelector('h4');
  const productName = nameEl?.textContent || 'Yaourt';
  
  addToCartById(productId, qty);
  
  // Réinitialiser la quantité
  if (qtyInput) qtyInput.value = '1';
  
  // Message de confirmation
  Swal.fire({
    title: 'Succès!',
    text: `${qty}x ${productName} ajouté au panier`,
    icon: 'success',
    timer: 1500
  });
};

// Fermer les modals en cliquant en dehors
document.addEventListener('click', function(event) {
  const yogurtModal = document.getElementById('yogurtModal');
  if (yogurtModal && event.target === yogurtModal) {
    closeYogurtModal();
  }
});

};

// ========== INITIALISATION GLOBALE ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initialisation features-extended...');
  initDarkMode();
  initHeroCarousel();
  filterAndSortProducts();
  showRecommendations();
  initScrollToTop();
  initMiniCart();
  
  // Afficher moyenne avis
  const avgRating = getAverageRating();
  const ratingEl = document.getElementById('averageRating');
  if (ratingEl) {
    ratingEl.textContent = avgRating + ' ⭐ (' + loadReviews().length + ' avis)';
  }
});
