// Helpers Firestore pour le front-end
// Utilisez ces fonctions pour remplacer l'usage de localStorage pour orders/visitors.
// Remarque: pour la collecte IP fiable, préférez une Cloud Function serveur (logVisitor).

import { db } from './firebase-init.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

export async function addOrder(order) {
  const ordersCol = collection(db, 'orders');
  const docRef = await addDoc(ordersCol, { ...order, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function addVisitor(visitor) {
  const visitorsCol = collection(db, 'visitors');
  await addDoc(visitorsCol, { ...visitor, createdAt: serverTimestamp() });
}

export function onOrdersSnapshot(cb) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}

export function onVisitorsSnapshot(cb) {
  const q = query(collection(db, 'visitors'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}

export async function markOrderDelivered(orderId, delivered = true) {
  const d = doc(db, 'orders', orderId);
  await updateDoc(d, { delivered });
}

export async function getOrder(orderId) {
  const d = doc(db, 'orders', orderId);
  const s = await getDoc(d);
  return s.exists() ? { id: s.id, ...s.data() } : null;
}
