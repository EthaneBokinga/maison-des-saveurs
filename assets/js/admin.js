/* Admin dashboard JS (improved) */

function getOrders() { return JSON.parse(localStorage.getItem('orders') || '[]'); }
function saveOrders(list) { localStorage.setItem('orders', JSON.stringify(list)); }

// Store location (point de départ pour calcul distances) - ajustez si besoin
const STORE_LOCATION = { lat: -4.266, lng: 15.283 };

// Fournir des icônes inline (data URI) pour éviter les 404 sur les images marker
try {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C6 0 1 5.5 1 12.3 1 21.5 12.5 41 12.5 41S24 21.5 24 12.3C24 5.5 19 0 12.5 0z" fill="#d35400"/></svg>`;
  const encoded = encodeURIComponent(svg);
  const dataUrl = `data:image/svg+xml;charset=UTF-8,${encoded}`;
  if (window.L && L.Icon && L.Icon.Default) {
    // set both prototype option and static imagePath to empty so Leaflet
    // does not prefix a directory to data: URIs
    L.Icon.Default.mergeOptions({ iconUrl: dataUrl, iconRetinaUrl: dataUrl, shadowUrl: '' });
    try { L.Icon.Default.imagePath = ''; } catch (e) {}
    try { L.Icon.Default.prototype.options.imagePath = ''; } catch (e) {}
  }
} catch (e) { console.warn('Inline marker icon setup failed', e); }

function renderStats() {
  const visitorsList = JSON.parse(localStorage.getItem('visitors') || '[]');
  document.getElementById('stat-visitors').textContent = visitorsList.length || 0;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  document.getElementById('stat-users').textContent = users.length;
  const orders = getOrders();
  document.getElementById('stat-orders').textContent = orders.length;
}

function getVisitors() { return JSON.parse(localStorage.getItem('visitors') || '[]'); }
function saveVisitors(list) { localStorage.setItem('visitors', JSON.stringify(list)); }

let visitorsLayer;
function refreshVisitorsMarkers() {
  if (!map) return;
  if (!visitorsLayer) visitorsLayer = L.layerGroup().addTo(map);
  visitorsLayer.clearLayers();
  const visitors = getVisitors();
  const bounds = [];
  visitors.forEach(v => {
    if (v.lat && v.lng) {
      const m = L.circleMarker([v.lat, v.lng], { radius:6, color:'#1e90ff', fill:true, fillColor:'#1e90ff', opacity:0.9 }).addTo(visitorsLayer);
      const popup = `<strong>IP: ${v.ip}</strong><br/>${v.city || ''} ${v.region || ''} ${v.country || ''}<br/>${v.visitedAt}`;
      m.bindPopup(popup);
      bounds.push([v.lat, v.lng]);
      m.visitorId = v.id;
    }
  });
  if (bounds.length) {
    try { map.fitBounds(bounds, { padding: [40,40] }); } catch(e){}
  }
}

function renderVisitors() {
  const container = document.getElementById('visitorsContainer');
  if (!container) return;
  container.innerHTML = '';
  const visitors = getVisitors();
  if (!visitors.length) { container.innerHTML = '<p class="muted">Aucun visiteur enregistré.</p>'; return; }
  visitors.slice(0,50).forEach(v => {
    const card = document.createElement('div');
    card.className = 'admin-order-card';
    card.style.cursor = 'default';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <strong>${v.ip || 'IP inconnue'}</strong>
          <div class="muted">${v.city || ''} ${v.region || ''} ${v.country || ''}</div>
          <div class="muted">${v.path || ''} · ${v.visitedAt}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <button class="btn small" data-id="${v.id}">Voir</button>
          <button class="btn small" data-copy="${v.ip}">Copier IP</button>
        </div>
      </div>
    `;
    const viewBtn = card.querySelector('button[data-id]');
    const copyBtn = card.querySelector('button[data-copy]');
    viewBtn.addEventListener('click', () => {
      if (v.lat && v.lng && map) {
        map.setView([v.lat, v.lng], 14);
        if (visitorsLayer) {
          visitorsLayer.eachLayer(layer => { if (layer.visitorId === v.id && layer.openPopup) layer.openPopup(); });
        }
      } else {
        Swal.fire('Info', 'Position non disponible pour ce visiteur.', 'info');
      }
    });
    copyBtn.addEventListener('click', () => {
      try { navigator.clipboard.writeText(v.ip || ''); Swal.fire({ toast:true, position:'top-end', icon:'success', title:'IP copiée', showConfirmButton:false, timer:1400 }); }
      catch(e){ Swal.fire('Erreur', 'Impossible de copier', 'error'); }
    });
    container.appendChild(card);
  });
}

let map, markersLayer;
let routeLayer;
function initMap() {
  try {
    map = L.map('dashboardMap').setView([STORE_LOCATION.lat, STORE_LOCATION.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    // show store marker
    L.circleMarker([STORE_LOCATION.lat, STORE_LOCATION.lng], { radius:8, color:'#d35400', fill:true, fillColor:'#d35400' }).addTo(map).bindPopup('Point de vente');
    refreshMarkers();
  } catch (e) { console.warn('Leaflet init failed', e); }
}

function clearRoute() {
  try {
    if (!routeLayer) return;
    if (routeLayer.clearLayers) { routeLayer.clearLayers(); }
    else { map.removeLayer(routeLayer); }
    routeLayer = null;
  } catch (e) { console.warn('clearRoute failed', e); }
}

function drawRouteOnDashboard(order) {
  if (!map || !order || !order.lat || !order.lng) return;
  clearRoute();
  routeLayer = L.layerGroup().addTo(map);
  const latlngs = [[STORE_LOCATION.lat, STORE_LOCATION.lng], [order.lat, order.lng]];
  // polyline route (straight line approximation)
  L.polyline(latlngs, { color: '#d35400', weight: 5, opacity: 0.85 }).addTo(routeLayer);
  // destination marker
  L.marker([order.lat, order.lng]).addTo(routeLayer).bindPopup(`<strong>${order.customer}</strong><br/>${order.address}`).openPopup();
  // store marker (small)
  L.circleMarker([STORE_LOCATION.lat, STORE_LOCATION.lng], { radius:6, color:'#d35400', fill:true, fillColor:'#d35400' }).addTo(routeLayer).bindPopup('Point de vente');
  try { map.fitBounds(latlngs, { padding: [40,40] }); } catch(e){}
}

// Haversine distance (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  function toRad(v){return v*Math.PI/180}
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

function formatDistanceKm(km) { return `${km.toFixed(2)} km`; }

function refreshMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  const orders = getOrders();
  const bounds = [];
  orders.forEach(o => {
    if (o.lat && o.lng) {
      const dist = haversineKm(STORE_LOCATION.lat, STORE_LOCATION.lng, o.lat, o.lng);
      const popup = `<strong>${o.customer}</strong><br/>${o.address}<br/>Distance: ${formatDistanceKm(dist)}`;
      const m = L.marker([o.lat, o.lng]).addTo(markersLayer).bindPopup(popup);
      bounds.push([o.lat, o.lng]);
      m.orderId = o.id;
    }
  });
  if (bounds.length) {
    try { map.fitBounds(bounds, { padding: [40,40] }); } catch(e){}
  }
}

function renderOrders() {
  const container = document.getElementById('ordersContainer');
  container.innerHTML = '';
  const orders = getOrders();
  if (!orders.length) { container.innerHTML = '<p class="muted">Aucune commande pour le moment.</p>'; return; }
  orders.forEach(order => {
    const distKm = (order.lat && order.lng) ? haversineKm(STORE_LOCATION.lat, STORE_LOCATION.lng, order.lat, order.lng) : null;
    const etaMin = distKm ? Math.round((distKm / 25) * 60) : null; // approx speed 25 km/h
    const card = document.createElement('div');
    card.className = 'admin-order-card';
    card.innerHTML = `
      <div class="order-head">
        <div>
          <strong>${order.customer}</strong>
          <div class="muted">ID: ${order.id} · ${order.date}</div>
          <div class="muted">${order.address}</div>
          ${distKm ? `<div class="muted">Distance: ${formatDistanceKm(distKm)} · ETA: ~${etaMin} min</div>` : ''}
        </div>
        <div class="order-actions">
          <button class="btn small" data-id="${order.id}">Voir</button>
          <a class="wa-link" href="https://wa.me/${cleanPhone(order.phone)}" target="_blank" rel="noopener" title="Contacter via WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>
      <div class="order-body">
        <div>Articles: ${order.items ? order.items.length : 0}</div>
        <div class="muted">Total: ${order.total}</div>
      </div>
      <div class="order-footer">
        <label><input type="checkbox" ${order.delivered ? 'checked' : ''} data-id="${order.id}"> Livré</label>
      </div>
    `;
    const btn = card.querySelector('button'); btn.addEventListener('click', () => viewOrder(order.id));
    const cb = card.querySelector('input[type="checkbox"]'); cb.addEventListener('change', (e) => toggleDelivered(order.id, e.target.checked));
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase()==='input' || e.target.tagName.toLowerCase()==='button' || e.target.closest('.wa-link')) return;
      if (order.lat && order.lng && map) {
        drawRouteOnDashboard(order);
      }
    });
    container.appendChild(card);
  });
}

function cleanPhone(p) { if (!p) return ''; return p.replace(/[^0-9]/g, ''); }

function viewOrder(id) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;
  let itemsHtml = '';
  if (order.items && order.items.length) order.items.forEach(it => { itemsHtml += `<div style="margin-bottom:6px;"><strong>${it.name || 'Produit'}</strong> × ${it.quantity || 1} — ${it.price || ''}</div>`; });
  const distKm = (order.lat && order.lng) ? haversineKm(STORE_LOCATION.lat, STORE_LOCATION.lng, order.lat, order.lng) : null;
  const etaMin = distKm ? Math.round((distKm / 25) * 60) : null;
  const html = `
    <div style="text-align:left;">
      <p><strong>${order.customer}</strong> — ${order.phone}</p>
      <p class="muted">${order.address}</p>
      ${distKm ? `<p class="muted">Distance: ${formatDistanceKm(distKm)} · ETA: ~${etaMin} min</p>` : ''}
      <hr />
      <div>${itemsHtml}</div>
      <p><strong>Total: ${order.total}</strong></p>
      <div id="order-map" style="height:320px; border-radius:8px; overflow:hidden;"></div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${STORE_LOCATION.lat},${STORE_LOCATION.lng}&destination=${order.lat},${order.lng}">Ouvrir Itinéraire</a>
        <a class="btn" target="_blank" rel="noopener" href="https://wa.me/${cleanPhone(order.phone)}">Contacter (WhatsApp)</a>
      </div>
    </div>
  `;
  Swal.fire({ title: `Commande ${order.id}`, html: html, width: 760, showCloseButton: true, confirmButtonText: 'Fermer', didOpen: () => {
    try {
      const mapDiv = document.getElementById('order-map'); mapDiv.innerHTML = '';
      const omap = L.map('order-map').setView([order.lat || STORE_LOCATION.lat, order.lng || STORE_LOCATION.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(omap);
      L.marker([order.lat || STORE_LOCATION.lat, order.lng || STORE_LOCATION.lng]).addTo(omap).bindPopup(order.address).openPopup();
      L.polyline([[STORE_LOCATION.lat, STORE_LOCATION.lng],[order.lat, order.lng]], { color: '#d35400' }).addTo(omap);
    } catch (e) { console.warn('Leaflet order map failed', e); }
  }});
}

function toggleDelivered(id, checked) { const orders = getOrders(); const idx = orders.findIndex(o => o.id === id); if (idx === -1) return; orders[idx].delivered = !!checked; saveOrders(orders); renderOrders(); refreshMarkers(); }

let lastOrdersCount = getOrders().length;
function checkNewOrders() { const orders = getOrders(); if (orders.length > lastOrdersCount) { const diff = orders.length - lastOrdersCount; Swal.fire({ icon: 'info', title: 'Nouvelle commande', text: `Vous avez ${diff} nouvelle(s) commande(s).`, confirmButtonColor: '#d35400' }); lastOrdersCount = orders.length; renderOrders(); renderStats(); refreshMarkers(); } }

document.addEventListener('DOMContentLoaded', () => {
  renderOrders(); renderStats(); initMap(); renderVisitors();
  // refresh markers after map init
  setTimeout(() => { refreshMarkers(); refreshVisitorsMarkers(); }, 800);
  setInterval(checkNewOrders, 3000);
  // poll visitors for changes (simple approach)
  let lastVisitorsCount = getVisitors().length;
  setInterval(() => {
    const vcount = getVisitors().length;
    if (vcount !== lastVisitorsCount) { lastVisitorsCount = vcount; renderVisitors(); renderStats(); refreshVisitorsMarkers(); }
  }, 4000);
});

window.viewOrder = viewOrder; window.toggleDelivered = toggleDelivered;
const orders = getOrders();

