// features.js - Fonctionnalités principales
console.log('features.js chargé');

const products = [
  { id: 'yogurt-banane', name: 'Yaourt Banane', price: 450, image: 'yaourt%20banane.jpeg' },
  { id: 'yogurt-fraise', name: 'Yaourt Fraise', price: 450, image: 'yaourt%20fraise%20.png' },
  { id: 'yogurt-vanille', name: 'Yaourt à la Vanille', price: 450, image: 'yaourt%20%C3%A0%20la%20vanille%20.png' },
  { id: 'yogurt-coco', name: 'Yaourt Coco', price: 450, image: 'yaourt%20%20coco.png' }
];

// ========== SÉCURITÉ ==========
function sanitize(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  let s = str.trim().slice(0, maxLen);
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/on[\w]+\s*=\s*(["']).*?\1/gi, '');
  s = s.replace(/[<>]/g, '');
  return s;
}

function escapeHtml(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, c => map[c]);
}

// ========== COOKIES ==========
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days || 7) * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? decodeURIComponent(v.pop()) : '';
}

// ========== PANIER ==========
function getCart() {
  try {
    return window.cart || JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    return [];
  }
}

function setCart(c) {
  try {
    window.cart = c;
    localStorage.setItem('cart', JSON.stringify(c));
    if (window.updateCartCount) window.updateCartCount();
  } catch (e) {
    console.warn(e);
  }
}

function addToCartById(id, qty = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(i => i.name === product.name);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ name: product.name, price: product.price, quantity: qty });
  }
  setCart(cart);
  if (window.Swal) {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: `✓ ${product.name} ajouté`,
      showConfirmButton: false,
      timer: 1500,
      toast: true
    });
  }
  const container = document.getElementById('searchResults');
  if (container) container.style.display = 'none';
}

// Rendre la fonction accessible globalement
window.addToCartById = addToCartById;

// ========== RECHERCHE ==========
window.performSearch = function() {
  const input = document.getElementById('productSearch');
  const q = (input ? input.value : '').trim();
  
  if (!q) {
    const container = document.getElementById('searchResults');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:1.5rem; color:#999;">
          <i class="fas fa-search" style="font-size:2.5rem; color:#d35400; opacity:0.3; margin-bottom:0.5rem; display:block;"></i>
          <p style="font-size:1rem; margin:0.5rem 0;">Veuillez entrer un terme de recherche pour trouver nos produits</p>
          <p style="font-size:0.9rem; color:#bbb;">Ex: yaourt, banane, vanille...</p>
        </div>
      `;
      container.style.display = 'block';
    }
    return;
  }
  
  const ql = q.toLowerCase();
  const results = products.filter(p => p.name.toLowerCase().includes(ql));
  
  const container = document.getElementById('searchResults');
  if (!container) return;
  
  if (results.length === 0) {
    container.style.display = 'block';
    container.innerHTML = `
      <div style="text-align:center; padding:1.5rem;">
        <p style="font-size:1rem; color:#d35400; font-weight:700;">Aucun produit trouvé</p>
        <p style="color:#999;">Aucun résultat pour « ${escapeHtml(q)} ». Essayez un autre terme.</p>
      </div>
    `;
    return;
  }
  
  let html = '<h3>Résultats de recherche</h3><div class="search-grid">';
  results.forEach(p => {
    const isFav = isInFavorites(p.id);
    const favBtnBg = isFav ? 'background:#e74c3c;' : 'background:#d35400;';
    html += `
      <div class="search-card">
        <div class="search-img-frame">
          <img src="assets/images/${p.image}" alt="${escapeHtml(p.name)}">
        </div>
        <h4>${escapeHtml(p.name)}</h4>
        <div class="search-price">${p.price} FCFA</div>
        <div style="display:flex; gap:8px;">
          <button class="btn-add-search" onclick="addToCartById('${p.id}', 1);" style="flex:1;">🛒 Ajouter</button>
          <button class="btn-add-search search-fav-btn" data-id="${p.id}" onclick="addToFavorites('${p.id}');" style="flex:1; ${favBtnBg}color:#fff;"><i class="fa-regular fa-heart" aria-hidden="true"></i> Favori</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
  container.style.display = 'block';
};

// ========== FAVORIS ==========
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavorites(arr) {
  localStorage.setItem('favorites', JSON.stringify(arr));
  updateFavoritesUI();
  updateFavoritesButtonColors();
}

// Vérifier si un produit est dans les favoris
function isInFavorites(id) {
  const favs = getFavorites();
  return favs.some(f => f.id === id);
}

// Mettre à jour la couleur des boutons favoris
function updateFavoritesButtonColors() {
  const buttons = document.querySelectorAll('.wishlist-btn, .btn-add-search[onclick*="addToFavorites"]');
  buttons.forEach(btn => {
    const id = btn.dataset.id;
    if (id && isInFavorites(id)) {
      btn.style.background = '#e74c3c';
      btn.style.color = '#fff';
    } else {
      btn.style.background = '';
      btn.style.color = '';
    }
  });
}

window.addToFavorites = function(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  const favs = getFavorites();
  const exists = favs.find(f => f.id === id);
  
  if (!exists) {
    favs.push({ id: product.id, name: product.name, price: product.price, image: product.image });
    saveFavorites(favs);
    if (window.Swal) {
      Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Ajouté aux favoris',
          showConfirmButton: false,
          timer: 1000,
          toast: true
        });
    }
  } else {
    removeFavorite(id);
  }
};

// Fonction pour ajouter aux favoris avec données directes (pour les produits en modal)
window.addToFavoritesWithData = function(id, name, price, image) {
  const favs = getFavorites();
  const exists = favs.find(f => f.id === id);
  
  if (!exists) {
    favs.push({ id, name, price, image });
    saveFavorites(favs);
    if (window.Swal) {
      Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Ajouté aux favoris',
          showConfirmButton: false,
          timer: 1000,
          toast: true
        });
    }
  } else {
    removeFavorite(id);
  }
};

function removeFavorite(id) {
  const favs = getFavorites();
  const filtered = favs.filter(f => f.id !== id);
  saveFavorites(filtered);
  // Rafraîchir la modal si elle est ouverte
  const modal = document.getElementById('favoritesModal');
  if (modal && modal.style.display === 'block') {
    showFavorites();
  }
  if (window.Swal) {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Retiré des favoris',
      showConfirmButton: false,
      timer: 800,
      toast: true
    });
  }
}

// Rendre removeFavorite globale
window.removeFavorite = removeFavorite;

function updateFavoritesUI() {
  const count = getFavorites().length;
  const badge = document.getElementById('favoritesCount');
  if (badge) badge.textContent = count;
}

window.showFavorites = function() {
  const favs = getFavorites();
  const modal = document.getElementById('favoritesModal');
  if (!modal) return;
  
  const list = document.getElementById('favoritesList');
  
  if (favs.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">Aucun favori pour le moment</p>';
  } else {
    let html = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:1rem;">';
    favs.forEach(f => {
      html += `
        <div style="background:#fff; border:2px solid #d35400; border-radius:8px; padding:1rem; text-align:center;">
          <img src="assets/images/${f.image}" alt="${escapeHtml(f.name)}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:0.5rem;">
          <h4 style="margin:0.5rem 0; font-size:0.9rem;">${escapeHtml(f.name)}</h4>
          <p style="color:#d35400; font-weight:700; margin:0.5rem 0;">${f.price} FCFA</p>
          <button onclick="addToCartById('${f.id}', 1);" style="background:#d35400; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; width:100%; margin-bottom:0.4rem;">Panier</button>
          <button onclick="removeFavorite('${f.id}');" style="background:#ff5252; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; width:100%;">Retirer</button>
        </div>
      `;
    });
    html += '</div>';
    list.innerHTML = html;
  }
  
  modal.style.display = 'block';
};

window.closeFavorites = function() {
  const modal = document.getElementById('favoritesModal');
  if (modal) modal.style.display = 'none';
};

// ========== AVIS ==========
function loadReviews() {
  try {
    return JSON.parse(localStorage.getItem('reviews') || '[]');
  } catch (e) {
    return [];
  }
}

function saveReviews(arr) {
  localStorage.setItem('reviews', JSON.stringify(arr));
}

window.deleteReview = function(idx) {
  const list = loadReviews();
  const review = list[idx];
  const currentUser = localStorage.getItem('currentUser');
  
  // Vérifier que c'est le même user
  if (!review || review.email !== currentUser) {
    if (window.Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Non autorisé',
        text: 'Vous ne pouvez supprimer que votre propre avis',
        timer: 2000
      });
    }
    return;
  }
  
  if (!confirm('⚠️ Supprimer cet avis ?')) return;
  list.splice(idx, 1);
  saveReviews(list);
  renderReviews();
  if (window.Swal) {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Avis supprimé',
      showConfirmButton: false,
      timer: 1200,
      toast: true
    });
  }
};

function renderReviews() {
  const list = loadReviews();
  const container = document.getElementById('reviewsList');
  if (!container) return;
  
  const currentUser = localStorage.getItem('currentUser');
  const resetBtn = document.getElementById('resetReviewsBtn');
  
  // Afficher le bouton réinitialiser seulement si user est connecté (admin)
  if (resetBtn) {
    resetBtn.style.display = currentUser ? 'block' : 'none';
  }
  
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999; padding:1rem;">Aucun avis pour le moment. Soyez le premier à laisser un avis !</p>';
    return;
  }
  
  let html = '';
  list.forEach((r, idx) => {
    const isOwner = currentUser && r.email === currentUser;
    const deleteBtn = isOwner ? `<button onclick="deleteReview(${idx})" style="background:#ff5252; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; font-size:0.85rem; white-space:nowrap; margin-left:1rem;">🗑️ Supprimer</button>` : '';
    
    html += `
      <div class="review-item">
        <div class="review-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="color:#2c2c2c;">${escapeHtml(r.name || 'Anonyme')}</strong>
            <span style="color:#d35400; margin-left:0.5rem;">⭐ ${r.rating}/5</span>
            <div style="color:#999; font-size:0.9rem; margin-top:0.2rem;">${escapeHtml(r.date)}</div>
          </div>
          ${deleteBtn}
        </div>
        <div class="review-body" style="margin-top:0.8rem; color:#555; line-height:1.5;">"${escapeHtml(r.comment)}"</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function initReviewForm() {
  const form = document.getElementById('reviewForm');
  const notLogged = document.getElementById('notLoggedReview');
  const submitBtn = document.getElementById('submitReviewBtn');
  
  if (!form || !notLogged) return;
  
  function updateVisibility() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      form.style.display = 'block';
      notLogged.style.display = 'none';
    } else {
      form.style.display = 'none';
      notLogged.style.display = 'block';
    }
  }
  
  updateVisibility();
  window.addEventListener('storage', updateVisibility);
  
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      const rating = parseInt(document.getElementById('reviewRating').value) || 5;
      const comment = sanitize(document.getElementById('reviewComment').value, 500);
      
      if (!comment) {
        if (window.Swal) Swal.fire('Erreur', 'Veuillez entrer un commentaire');
        return;
      }
      
      const email = localStorage.getItem('currentUser');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email) || {};
      
      const review = {
        id: 'rev_' + Date.now(),
        name: user.name || email || 'Utilisateur',
        email: email,
        rating: Math.max(1, Math.min(5, rating)),
        comment,
        date: new Date().toLocaleString('fr-FR')
      };
      
      const list = loadReviews();
      list.unshift(review);
      saveReviews(list);
      renderReviews();
      
      document.getElementById('reviewComment').value = '';
      document.getElementById('reviewRating').value = '5';
      
      if (window.Swal) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Avis posté !',
          showConfirmButton: false,
          timer: 1500,
          toast: true
        });
      }
    });
  }
}

// ========== SIGNALEMENT PROBLÈME ==========
function initReportIssue() {
  const btn = document.getElementById('reportIssueBtn');
  if (!btn) return;
  
  btn.addEventListener('click', function() {
    if (!window.Swal) {
      alert('Signaler un problème');
      return;
    }
    
    Swal.fire({
      title: 'Signaler un problème',
      html: `
        <input id="issue-subject" class="swal2-input" placeholder="Sujet du problème" style="margin-bottom:8px;">
        <textarea id="issue-desc" class="swal2-textarea" placeholder="Décrivez le souci (max 500 caractères)" style="height:100px; margin-bottom:8px;"></textarea>
        <input id="issue-contact" class="swal2-input" placeholder="Votre téléphone ou email">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const subject = sanitize(document.getElementById('issue-subject').value, 200);
        const desc = sanitize(document.getElementById('issue-desc').value, 500);
        const contact = sanitize(document.getElementById('issue-contact').value, 200);
        
        if (!subject || !desc || !contact) {
          Swal.showValidationMessage('Tous les champs sont requis');
          return;
        }
        
        return { subject, desc, contact };
      }
    }).then(res => {
      if (res.isConfirmed) {
        const issues = JSON.parse(localStorage.getItem('issues') || '[]');
        const email = localStorage.getItem('currentUser') || 'Anonyme';
        issues.unshift({
          id: 'iss_' + Date.now(),
          user: email,
          subject: res.value.subject,
          desc: res.value.desc,
          contact: res.value.contact,
          date: new Date().toLocaleString('fr-FR')
        });
        localStorage.setItem('issues', JSON.stringify(issues.slice(0, 100)));
        
        Swal.fire({
          icon: 'success',
          title: 'Problème signalé',
          text: 'Merci, nous traiterons votre demande rapidement',
          timer: 2000
        });
      }
    });
  });
}

// ========== FORMULAIRE CONTACT ==========
function hardenContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    const website = document.getElementById('website');
    if (website && website.value.trim() !== '') {
      e.preventDefault();
      return;
    }
    
    ['name', 'email', 'phone', 'message'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = sanitize(el.value, id === 'message' ? 2000 : 200);
      }
    });
    
    try {
      const msgs = JSON.parse(localStorage.getItem('messages') || '[]');
      msgs.unshift({
        id: 'msg_' + Date.now(),
        name: sanitize(document.getElementById('name').value),
        email: sanitize(document.getElementById('email').value),
        phone: sanitize(document.getElementById('phone').value),
        message: sanitize(document.getElementById('message').value, 2000),
        date: new Date().toLocaleString('fr-FR')
      });
      localStorage.setItem('messages', JSON.stringify(msgs.slice(0, 200)));
    } catch (e) {
      console.warn(e);
    }
  }, true);
}

// ========== COOKIES ==========
function initCookies() {
  if (!getCookie('visited')) {
    setCookie('visited', new Date().toISOString(), 365);
  }
  
  const current = localStorage.getItem('currentUser');
  if (current) {
    setCookie('session_user', current, 7);
  }
}

// ========== RÉINITIALISER AVIS ==========
window.resetAllReviews = function() {
  const currentUser = localStorage.getItem('currentUser');
  
  // Seuls les users connectés peuvent réinitialiser
  if (!currentUser) {
    if (window.Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Non autorisé',
        text: 'Vous devez être connecté pour réinitialiser les avis',
        timer: 2000
      });
    }
    return;
  }
  
  if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUS les avis ? Cette action est irréversible.')) return;
  localStorage.removeItem('reviews');
  renderReviews();
  if (window.Swal) {
    Swal.fire({
      icon: 'success',
      title: 'Tous les avis ont été supprimés',
      timer: 2000
    });
  }
};

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initialisation des features...');
  try {
    renderReviews();
    initReviewForm();
    initReportIssue();
    hardenContactForm();
    initCookies();
    console.log('Features initialisées ✓');
  } catch (e) {
    console.error('Erreur lors de l\'initialisation des features:', e);
  }
});
