// Remplissez ce fichier avec la configuration de votre projet Firebase.
// Copiez l'objet `firebaseConfig` depuis la console Firebase (Project settings -> SDK) et remplacez les valeurs ci-dessous.

export const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "<YOUR_PROJECT_ID>.firebaseapp.com",
  projectId: "<YOUR_PROJECT_ID>",
  storageBucket: "<YOUR_PROJECT_ID>.appspot.com",
  messagingSenderId: "<YOUR_SENDER_ID>",
  appId: "<YOUR_APP_ID>",
  // measurementId: "G-XXXXXXXX" // optionnel
};

// Ensuite, dans `assets/js/firebase-init.js` l'initialisation importera cet objet.
