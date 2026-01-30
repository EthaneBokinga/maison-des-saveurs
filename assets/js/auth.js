// Gestion simple d'authentification côté client (démo)
// Utilise localStorage pour stocker les utilisateurs (ne remplace pas un backend sécurisé)

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

async function registerUser(event) {
  // Récupère et valide les données du formulaire d'inscription
  if (event) event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;

  // Validation basique
  if (!name || !email || !password) {
    Swal.fire('Erreur', 'Remplissez tous les champs obligatoires.', 'error');
    return;
  }
  if (password !== password2) {
    Swal.fire('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
    return;
  }

  // Récupère la liste existante des utilisateurs
  const users = getUsers();
  // Vérifie si l'email est déjà enregistré
  if (users.find(u => u.email === email)) {
    Swal.fire('Erreur', 'Un compte existe déjà pour cet e-mail.', 'error');
    return;
  }

  // Hache le mot de passe et crée le nouvel utilisateur
  const passwordHash = await hashPassword(password);
  users.push({ name, email, phone, passwordHash, createdAt: new Date().toISOString() });
  saveUsers(users);

  // Connecte automatiquement et redirige vers l'accueil
  Swal.fire('Succès', 'Compte créé. Vous êtes connecté.', 'success').then(() => {
    localStorage.setItem('currentUser', email);
    window.location.href = 'index.html';
  });
}

async function loginUser(event) {
  // Récupère et valide les données du formulaire de connexion
  if (event) event.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) {
    Swal.fire('Erreur', 'Veuillez remplir tous les champs.', 'error');
    return;
  }
  
  // Cherche l'utilisateur par email
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    Swal.fire('Erreur', 'Aucun compte trouvé pour cet e-mail.', 'error');
    return;
  }
  
  // Vérifie que le mot de passe correspond
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    Swal.fire('Erreur', 'Mot de passe incorrect.', 'error');
    return;
  }

  // Sauvegarde l'utilisateur connecté et redirige
  localStorage.setItem('currentUser', email);
  Swal.fire('Bienvenue', `Vous êtes connecté, ${user.name}.`, 'success').then(() => {
    window.location.href = 'index.html';
  });
}

function logout() {
  // Supprime l'utilisateur connecté et redirige vers l'accueil
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  // Récupère l'utilisateur actuellement connecté
  const email = localStorage.getItem('currentUser');
  if (!email) return null;
  const users = getUsers();
  return users.find(u => u.email === email) || null;
}

function showAccountInfo(containerId) {
  // Récupère l'utilisateur connecté depuis localStorage
  const user = getCurrentUser();
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Références aux éléments d'authentification dans le menu
  const loginLink = document.getElementById('loginRegisterLinks');
  const createLink = document.getElementById('createAccountLink');
  
  if (!user) {
    // Utilisateur NON connecté : affiche les liens de connexion/inscription
    container.innerHTML = `<a href="login.html">Se connecter</a> | <a href="register.html">Créer un compte</a>`;
    if (loginLink) loginLink.style.display = 'inline';
    if (createLink) createLink.style.display = 'inline';
  } else {
    // Utilisateur connecté : affiche le bouton déconnexion
    container.innerHTML = `Bienvenue ${user.name} | <a href="#" onclick="logout(); return false;">Se déconnecter</a>`;
    // Cache les liens de connexion/inscription
    if (loginLink) loginLink.style.display = 'none';
    if (createLink) createLink.style.display = 'none';
  }
  
  // Mettre à jour le formulaire de contact selon la connexion
  updateContactFormAccess();
}

// Fonction pour mettre à jour l'accès au formulaire de contact
function updateContactFormAccess() {
  const contactFormContainer = document.getElementById('contactFormContainer');
  if (!contactFormContainer) return;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser) {
    // Utilisateur NON connecté : afficher le message de connexion requise
    contactFormContainer.innerHTML = `
      <div style="text-align:center; padding:2rem; background:#fff9e6; border:2px solid #d35400; border-radius:8px;">
        <h3 style="color:#d35400; margin-bottom:1rem;">⚠️ Connexion requise</h3>
        <p style="color:#666; margin-bottom:1.5rem; font-size:1.05rem;">
          Vous devez créer un compte ou vous connecter pour pouvoir nous contacter.
        </p>
        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
          <button class="btn" onclick="window.location.href='login.html'" style="background:#d35400; color:#fff; border:none; padding:0.8rem 1.5rem; border-radius:8px; cursor:pointer; font-size:1rem; font-weight:700;">Se connecter</button>
          <button class="btn" onclick="window.location.href='register.html'" style="background:#27ae60; color:#fff; border:none; padding:0.8rem 1.5rem; border-radius:8px; cursor:pointer; font-size:1rem; font-weight:700;">Créer un compte</button>
        </div>
      </div>
    `;
  } else {
    // Utilisateur connecté : afficher le formulaire (il doit être dans le HTML)
    // Vérifier si le formulaire existe
    if (!document.getElementById('contactForm')) {
      // Créer le formulaire s'il n'existe pas
      contactFormContainer.innerHTML = `
        <form id="contactForm" action="/send" method="POST" novalidate>
          <input type="text" name="website" id="website" class="honeypot" autocomplete="off" tabindex="-1">
          <label for="name">Nom complet </label>
          <input type="text" id="name" name="name" required maxlength="100">
          <label for="email">E-mail </label>
          <input type="email" id="email" name="email" required>
          <label for="phone">Téléphone</label>
          <input type="tel" id="phone" name="phone" pattern="^[0-9+()\-\s]{6,20}$">
          <label for="date">Date de l'événement (optionnel)</label>
          <input type="date" id="date" name="date">
          <label for="message">Message </label>
          <textarea id="message" name="message" rows="5" required maxlength="2000" style="resize: none;"></textarea>
          <div class="form-buttons">
            <button class="btn" type="submit">Envoyer</button>
            <button type="button" class="btn btn-secondary" id="reportIssueBtn">Signaler un problème</button>
          </div>
          <p class="form-note">Nous allons vous répondre dans les brefs délais</p>
        </form>
      `;
      // Réattacher les event listeners
      setupContactFormListener();
    }
  }
}

// Fonction pour configurer les event listeners du formulaire de contact
function setupContactFormListener() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (document.getElementById('website').value.trim() !== '') {
        e.preventDefault();
        return;
      }
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        e.preventDefault();
        Swal.fire('Erreur', 'Veuillez compléter tous les champs obligatoires.', 'error');
        return;
      }
      e.preventDefault();
      form.reset();
      Swal.fire('Succès', 'Merci ! Votre message a été envoyé.', 'success');
    });
  }
}

function resetPassword(event) {
  // Récupère l'email et propose d'aider l'utilisateur à réinitialiser son mot de passe
  if (event) event.preventDefault();
  const email = document.getElementById('reset-email').value.trim().toLowerCase();
  if (!email) {
    Swal.fire('Erreur', 'Veuillez entrer votre e-mail.', 'error');
    return;
  }
  
  // Vérifie que le compte existe
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    Swal.fire('Erreur', 'Aucun compte trouvé pour cet e-mail.', 'error');
    return;
  }

  // Simule l'envoi d'email et propose une réinitialisation immédiate (démo)
  Swal.fire({
    icon: 'info',
    title: 'Aide mot de passe',
    html: 'Un e-mail de réinitialisation a été envoyé à <strong>' + email + '</strong>.<br/><br/>Pour la démo, voulez-vous réinitialiser maintenant ?',
    showCancelButton: true,
    confirmButtonText: 'Réinitialiser maintenant',
    cancelButtonText: 'Fermer'
  }).then(async (res) => {
    if (res.isConfirmed) {
      // Formulaire pour entrer le nouveau mot de passe
      const { value: formValues } = await Swal.fire({
        title: 'Nouveau mot de passe',
        html: `
          <input id="swal-newpwd" type="password" class="swal2-input" placeholder="Nouveau mot de passe">
          <input id="swal-newpwd2" type="password" class="swal2-input" placeholder="Confirmez le mot de passe">
        `,
        focusConfirm: false,
        preConfirm: () => {
          const p1 = document.getElementById('swal-newpwd').value;
          const p2 = document.getElementById('swal-newpwd2').value;
          if (!p1 || p1 !== p2) {
            Swal.showValidationMessage('Les mots de passe doivent correspondre et ne pas être vides.');
          }
          return p1;
        }
      });
      if (formValues) {
        // Hache et met à jour le mot de passe
        const newHash = await hashPassword(formValues);
        user.passwordHash = newHash;
        saveUsers(users);
        Swal.fire('Succès', 'Mot de passe réinitialisé. Connectez-vous.', 'success');
      }
    }
  });
}

// Rendre fonctions accessibles globalement
window.registerUser = registerUser;
window.loginUser = loginUser;
window.resetPassword = resetPassword;
window.showAccountInfo = showAccountInfo;
window.logout = logout;
window.updateContactFormAccess = updateContactFormAccess;
window.setupContactFormListener = setupContactFormListener;

// UI helpers: update header account info and close nav on resize/click outside
document.addEventListener('DOMContentLoaded', () => {
  // Affiche l'info du compte dans le header et gère l'affichage des boutons de connexion
  try { showAccountInfo('accountInfo'); } catch(e){}

  // Ferme le menu mobile en redimensionnant la fenêtre
  window.addEventListener('resize', () => {
    const nav = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (window.innerWidth > 768 && nav && hamburger) {
      nav.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });

  // Ferme le menu mobile au clic en dehors
  document.addEventListener('click', (e) => {
    const nav = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (!nav || !hamburger) return;
    const target = e.target;
    const insideNav = nav.contains(target) || hamburger.contains(target);
    if (!insideNav && nav.classList.contains('active')) {
      nav.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
});
function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('wishlist', JSON.stringify(list));
}

function toggleWishlist(productId) {
  let wishlist = getWishlist();
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter(id => id !== productId);
    Swal.fire('Retiré', 'Produit retiré de vos favoris.', 'info');
  } else {
    wishlist.push(productId);
    Swal.fire('Ajouté', 'Produit ajouté à vos favoris.', 'success');
  }
  saveWishlist(wishlist);
  renderWishlist();
}

function renderWishlist() {
  const container = document.getElementById('wishlistContainer');
  if (!container) return;
  const wishlist = getWishlist();
  container.innerHTML = wishlist.length ? wishlist.map(id => `<li>${id}</li>`).join('') : '<p>Aucun favori.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleWishlist(btn.dataset.id));
  });
  renderWishlist();
});
