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
    container.innerHTML = `Bonjour ${user.name} | <a href="#" onclick="logout(); return false;">Se déconnecter</a>`;
    // Cache les liens de connexion/inscription
    if (loginLink) loginLink.style.display = 'none';
    if (createLink) createLink.style.display = 'none';
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
