// --- Real-Time Disaster Alert Map ---
// Uses Leaflet.js, fetches USGS earthquake data, supports user and mock disasters

// --- ICONS ---
// Custom icons for different event types and severities
const icons = {
  earthquakeRed: L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
  }),
  earthquakeOrange: L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-orange.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
  }),
  earthquakeYellow: L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-yellow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
  }),
  user: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // blue pin
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]
  }),
  mockFlood: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2930/2930016.png', // water drop
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]
  }),
  mockFire: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/482/482508.png', // fire
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]
  }),
  mockOther: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565547.png', // warning
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]
  })
};

// --- MAP INIT ---
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- LAYER GROUPS ---
const earthquakeLayer = L.layerGroup().addTo(map);
const userLayer = L.layerGroup().addTo(map);
const mockLayer = L.layerGroup().addTo(map);
// Phase 3: Tropical Storms (NOAA NHC RSS)
const stormLayer = L.layerGroup().addTo(map);
// Phase 3: GDACS (Global Disaster Alerts)
const gdacsLayer = L.layerGroup().addTo(map);
// Phase 3: NASA FIRMS Wildfires
const wildfireLayer = L.layerGroup().addTo(map);

// --- FILTER PANEL ---
function updateLayerVisibility() {
  earthquakeLayer.clearLayers();
  userLayer.clearLayers();
  mockLayer.clearLayers();
  stormLayer.clearLayers();
  gdacsLayer.clearLayers();
  wildfireLayer.clearLayers();
  if (document.getElementById('filter-earthquakes').checked) renderEarthquakes();
  if (document.getElementById('filter-user').checked) renderUserDisasters();
  if (document.getElementById('filter-mock').checked) renderMockDisasters();
  if (document.getElementById('filter-storms') && document.getElementById('filter-storms').checked) renderStorms();
  if (document.getElementById('filter-gdacs') && document.getElementById('filter-gdacs').checked) renderGdacs();
  if (document.getElementById('filter-wildfires') && document.getElementById('filter-wildfires').checked) renderWildfires();
}
// --- NASA FIRMS WILDFIRES ---
// Friendlier icon for wildfires (orange map pin)
const wildfireIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-orange.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

let wildfireData = [];
function fetchWildfires() {
  // NASA FIRMS global 24h (GeoJSON, no API key required)
  // Use CORS proxy if needed
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open';
  fetch(url)
    .then(res => res.json())
    .then(data => {
      // EONET returns events, each with geometry array
      wildfireData = [];
      (data.events || []).forEach(event => {
        (event.geometry || []).forEach(g => {
          if (g.coordinates && g.coordinates.length === 2) {
            wildfireData.push({
              lat: g.coordinates[1], // EONET is [lon, lat]
              lon: g.coordinates[0],
              title: event.title,
              date: g.date
            });
          }
        });
      });
      updateLayerVisibility();
    })
    .catch(() => { wildfireData = []; });
}

function renderWildfires() {
  console.log('Wildfire data:', wildfireData);
  wildfireData.forEach(fire => {
    const marker = L.marker([fire.lat, fire.lon], { icon: wildfireIcon });
    marker.bindPopup(
      `<b>Type:</b> Wildfire<br>` +
      `<b>Event:</b> ${fire.title || ''}<br>` +
      `<b>Time:</b> ${fire.date ? new Date(fire.date).toLocaleString() : ''}`
    );
    marker.addTo(wildfireLayer);
  });
}

fetchWildfires();
setInterval(fetchWildfires, 15 * 60 * 1000); // Refresh every 15 minutes
document.getElementById('filter-earthquakes').addEventListener('change', updateLayerVisibility);
document.getElementById('filter-user').addEventListener('change', updateLayerVisibility);
document.getElementById('filter-mock').addEventListener('change', updateLayerVisibility);
if (document.getElementById('filter-storms')) {
  document.getElementById('filter-storms').addEventListener('change', updateLayerVisibility);
}
if (document.getElementById('filter-gdacs')) {
  document.getElementById('filter-gdacs').addEventListener('change', updateLayerVisibility);
}
// --- GDACS (Global Disaster Alerts) ---
// Friendlier icon for GDACS (blue map pin)
const gdacsIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

let gdacsData = [];
function fetchGdacs() {
  // Use EONET for global disaster events (no API key, JSON, CORS OK)
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';
  fetch(url)
    .then(res => res.json())
    .then(data => {
      gdacsData = [];
      (data.events || []).forEach(event => {
        // Only show non-wildfire, non-storm events for GDACS
        if (event.categories.some(c => c.id !== 'wildfires' && c.id !== 'severeStorms')) {
          (event.geometry || []).forEach(g => {
            if (g.coordinates && g.coordinates.length === 2) {
              gdacsData.push({
                lat: g.coordinates[1],
                lon: g.coordinates[0],
                title: event.title,
                date: g.date,
                categories: event.categories.map(c => c.title).join(', ')
              });
            }
          });
        }
      });
      updateLayerVisibility();
    })
    .catch(() => { gdacsData = []; });
}

function renderGdacs() {
  gdacsData.slice(0, 100).forEach(event => {
    const marker = L.marker([event.lat, event.lon], { icon: gdacsIcon });
    marker.bindPopup(
      `<b>Type:</b> GDACS Alert<br>` +
      `<b>Event:</b> ${event.title}<br>` +
      `<b>Categories:</b> ${event.categories}<br>` +
      `<b>Location:</b> Lat ${event.lat}, Lon ${event.lon}<br>` +
      `<b>Time:</b> ${event.date ? new Date(event.date).toLocaleString() : 'N/A'}`
    );
    marker.addTo(gdacsLayer);
  });
}

fetchGdacs();
setInterval(fetchGdacs, 10 * 60 * 1000); // Refresh every 10 minutes

// --- LIVE EARTHQUAKE DATA ---
let earthquakeData = [];
function fetchEarthquakes() {
  fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
    .then(res => res.json())
    .then(data => {
      earthquakeData = data.features;
      updateLayerVisibility();
    });
}
function renderEarthquakes() {
  earthquakeData.forEach(eq => {
    const mag = eq.properties.mag;
    let icon = icons.earthquakeYellow;
    if (mag >= 5) icon = icons.earthquakeRed;
    else if (mag >= 3) icon = icons.earthquakeOrange;
    // Create marker
    const marker = L.marker([
      eq.geometry.coordinates[1],
      eq.geometry.coordinates[0]
    ], { icon });
    // Add pulse for strong quakes
    if (mag >= 4) marker._icon?.classList.add('pulse');
    // Popup content
    const time = new Date(eq.properties.time);
    marker.bindPopup(
      `<b>Magnitude:</b> ${mag}<br>` +
      `<b>Location:</b> ${eq.properties.place}<br>` +
      `<b>Time:</b> ${time.toLocaleString()}`
    );
    marker.addTo(earthquakeLayer);
  });
}
fetchEarthquakes();
setInterval(fetchEarthquakes, 60 * 1000); // Refresh every minute

// --- MOCK DISASTERS ---
const mockDisasters = [
  {
    type: 'Flood',
    coords: [34.05, -118.25],
    location: 'Los Angeles, CA',
    severity: 5
  },
  {
    type: 'Fire',
    coords: [37.77, -122.42],
    location: 'San Francisco, CA',
    severity: 4
  },
  {
    type: 'Other',
    coords: [48.85, 2.35],
    location: 'Paris, France',
    severity: 3
  }
];
function renderMockDisasters() {
  mockDisasters.forEach(d => {
    let icon = icons.mockOther;
    if (d.type === 'Flood') icon = icons.mockFlood;
    else if (d.type === 'Fire') icon = icons.mockFire;
    const marker = L.marker(d.coords, { icon });
    if (d.severity >= 4) marker.on('add', () => marker._icon?.classList.add('pulse'));
    marker.bindPopup(
      `<b>Type:</b> ${d.type}<br>` +
      `<b>Location:</b> ${d.location}<br>` +
      `<b>Severity:</b> ${d.severity}`
    );
    marker.addTo(mockLayer);
  });
}

// --- USER-REPORTED DISASTERS ---
function getUserDisasters() {
  return JSON.parse(localStorage.getItem('userDisasters') || '[]');
}
function saveUserDisasters(arr) {
  localStorage.setItem('userDisasters', JSON.stringify(arr));
}
function renderUserDisasters() {
  getUserDisasters().forEach(d => {
    const marker = L.marker(d.coords, { icon: icons.user });
    if (d.severity >= 4) marker.on('add', () => marker._icon?.classList.add('pulse'));
    marker.bindPopup(
      `<b>Type:</b> ${d.type}<br>` +
      `<b>Location:</b> ${d.location}<br>` +
      `<b>Severity:</b> ${d.severity}`
    );
    marker.addTo(userLayer);
  });
}

// --- REPORT DISASTER MODAL ---
const reportBtn = document.getElementById('report-btn');
const modalBg = document.getElementById('modal-bg');
const closeModal = document.getElementById('close-modal');
const reportForm = document.getElementById('report-form');
if (reportBtn && modalBg && closeModal && reportForm) {
  reportBtn.onclick = () => { modalBg.classList.add('active'); };
  closeModal.onclick = () => { modalBg.classList.remove('active'); };
  modalBg.onclick = e => { if (e.target === modalBg) modalBg.classList.remove('active'); };
  // Prevent form submission for now
  reportForm.onsubmit = function(e) { e.preventDefault(); modalBg.classList.remove('active'); };
}

// Filter panel stubs (logic to be added in later phases)
const filterEarthquakes = document.getElementById('filter-earthquakes');
const filterUser = document.getElementById('filter-user');
const filterMock = document.getElementById('filter-mock');
if (filterEarthquakes && filterUser && filterMock) {
  filterEarthquakes.addEventListener('change', () => {/* stub */});
  filterUser.addEventListener('change', () => {/* stub */});
  filterMock.addEventListener('change', () => {/* stub */});
}

// --- SUBMIT USER DISASTER ---
reportForm.onsubmit = function(e) {
  e.preventDefault();
  const type = document.getElementById('disaster-type').value;
  const location = document.getElementById('location-name').value;
  const severity = parseInt(document.getElementById('severity').value);
  // Generate random coords near map center
  const center = map.getCenter();
  const lat = center.lat + (Math.random() - 0.5) * 2;
  const lng = center.lng + (Math.random() - 0.5) * 2;
  const newDisaster = { type, location, severity, coords: [lat, lng] };
  const arr = getUserDisasters();
  arr.push(newDisaster);
  saveUserDisasters(arr);
  modalBg.classList.remove('active');
  updateLayerVisibility();
  reportForm.reset();
};


// --- TROPICAL STORMS (EONET) ---
// Unique icon for storms
const stormIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', // hurricane icon
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -28]
});

let stormData = [];
function fetchStorms() {
  // Use EONET for severe storms (no API key, JSON, CORS OK)
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=open';
  fetch(url)
    .then(res => res.json())
    .then(data => {
      stormData = [];
      (data.events || []).forEach(event => {
        (event.geometry || []).forEach(g => {
          if (g.coordinates && g.coordinates.length === 2) {
            stormData.push({
              lat: g.coordinates[1],
              lon: g.coordinates[0],
              title: event.title,
              date: g.date
            });
          }
        });
      });
      updateLayerVisibility();
    })
    .catch(() => { stormData = []; });
}

function renderStorms() {
  stormData.forEach(storm => {
    const marker = L.marker([storm.lat, storm.lon], { icon: stormIcon });
    marker.bindPopup(
      `<b>Type:</b> Tropical Storm<br>` +
      `<b>Name:</b> ${storm.title}<br>` +
      `<b>Location:</b> Lat ${storm.lat}, Lon ${storm.lon}<br>` +
      `<b>Time:</b> ${storm.date ? new Date(storm.date).toLocaleString() : 'N/A'}`
    );
    marker.addTo(stormLayer);
  });
}

fetchStorms();
setInterval(fetchStorms, 10 * 60 * 1000); // Refresh every 10 minutes

// --- INITIAL RENDER ---
renderMockDisasters();
renderUserDisasters();
// Storms will render via updateLayerVisibility after fetch

// --- Responsive map resize ---
window.addEventListener('resize', () => map.invalidateSize());

// --- Inline comments explain each major section above ---
