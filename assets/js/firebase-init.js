// Firebase initialization (ES module)
// Ce module importe le sdk via les CDN modulaires et initialise Firebase
// IMPORTANT: Assurez-vous d'avoir rempli `firebase-config.js` avec vos valeurs.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, auth, db, functions, storage };

// Note:
// - Pour les Cloud Functions (callable), utilisez `httpsCallable` depuis
//   'https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js' dans vos modules clients.
// - Les versions CDN peuvent être mises à jour ; adaptez l'URL si nécessaire.
