// script.js

const initialLat = marketData.length > 0 ? marketData[0].lat : 22.7161;
const initialLng = marketData.length > 0 ? marketData[0].lng : 89.0718;

const map = L.map('map', {
    zoomControl: false
}).setView([initialLat, initialLng], 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

const productIcons = {
    "Vegetables": '<i class="fa-solid fa-carrot" style="color: #f97316;"></i>',
    "Fish": '<i class="fa-solid fa-fish" style="color: #3b82f6;"></i>',
    "Duck": '<i class="fa-solid fa-kiwi-bird" style="color: #8b5cf6;"></i>',
    "Chicken": '<i class="fa-solid fa-drumstick-bite" style="color: #f43f5e;"></i>',
    "Egg": '<i class="fa-solid fa-egg" style="color: #f59e0b;"></i>',
    "Milk": '<i class="fa-solid fa-glass-water" style="color: #0ea5e9;"></i>',
    "Cattle": '<i class="fa-solid fa-cow" style="color: #64748b;"></i>',
    "Grocery": '<i class="fa-solid fa-shop" style="color: #10b981;"></i>'
};

let markers = [];
let currentActiveMarket = null;

// DOM Elements
const viewList = document.getElementById('view-list');
const viewDetail = document.getElementById('view-detail');
const marketListEl = document.getElementById('market-list');
const searchInput = document.getElementById('search-input');
const filterPills = document.querySelectorAll('.pill');
const marketCountEl = document.getElementById('market-count');
const btnBack = document.getElementById('btn-back');

const sdName = document.getElementById('sd-name');
const sdUnion = document.getElementById('sd-union');
const sdType = document.getElementById('sd-type');
const sdImage = document.getElementById('sd-image');
const sdNoImage = document.getElementById('sd-no-image');
const sdImageDesc = document.getElementById('sd-image-desc');
const sdShops = document.getElementById('sd-shops');
const sdDay = document.getElementById('sd-day');
const sdRoad = document.getElementById('sd-road');
const sdWomen = document.getElementById('sd-women');
const sdProducts = document.getElementById('sd-products');

let activeFilter = 'all';
let searchQuery = '';

function createCustomIcon(marketType, isActive = false) {
    const isPerm = marketType.includes("Permanent") || marketType.includes("স্থায়ী");
    const typeClass = isPerm ? 'perm' : 'temp';
    const activeClass = isActive ? 'active' : '';
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin ${typeClass} ${activeClass}"><i class="fa-solid ${isPerm ? 'fa-store' : 'fa-tent'}"></i></div>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40]
    });
}

function renderApp() {
    // Filter data
    const filteredData = marketData.filter(market => {
        const matchesFilter = activeFilter === 'all' || market.market_type === activeFilter;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = market.name.toLowerCase().includes(searchLower) || 
                              market.union.toLowerCase().includes(searchLower);
        return matchesFilter && matchesSearch;
    });
    
    marketCountEl.textContent = filteredData.length;
    
    renderList(filteredData);
    renderMarkers(filteredData);
}

function renderList(dataToRender) {
    marketListEl.innerHTML = '';
    
    if (dataToRender.length === 0) {
        marketListEl.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">No markets found.</div>';
        return;
    }
    
    dataToRender.forEach(market => {
        const card = document.createElement('div');
        card.className = `market-card ${currentActiveMarket === market.id ? 'active-card' : ''}`;
        card.dataset.id = market.id;
        
        let photoHtml = `<div class="card-img"><i class="fa-solid fa-image"></i></div>`;
        if (market.photos && market.photos.length > 0 && market.photos[0].url) {
            photoHtml = `<img src="${market.photos[0].url}" class="card-img" alt="Market">`;
        }
        
        let iconsHtml = '';
        if (market.activities && market.activities.length > 0) {
            iconsHtml = market.activities.slice(0, 5).map(act => productIcons[act] || '').join('');
            if (market.activities.length > 5) iconsHtml += `<span style="font-size:0.75rem; color:var(--text-muted)">+${market.activities.length-5}</span>`;
        }
        
        card.innerHTML = `
            ${photoHtml}
            <div class="card-info">
                <h3>${market.name}</h3>
                <p>${market.union}</p>
                <div class="card-icons">${iconsHtml}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectMarket(market);
        });
        
        marketListEl.appendChild(card);
    });
}

function renderMarkers(dataToRender) {
    markers.forEach(m => map.removeLayer(m.layer));
    markers = [];
    
    if (dataToRender.length > 0) {
        const latLngs = [];
        
        dataToRender.forEach((market, index) => {
            const isActive = currentActiveMarket === market.id;
            const markerLayer = L.marker([market.lat, market.lng], {
                icon: createCustomIcon(market.market_type, isActive),
                zIndexOffset: isActive ? 9999 : (1000 - index)
            }).addTo(map);
            
            markerLayer.bindTooltip(`<b>${market.name}</b><br>${market.union}`, {
                direction: 'top',
                offset: [0, -35],
                opacity: 0.9,
                className: 'custom-tooltip'
            });
            
            markerLayer.on('click', () => {
                selectMarket(market);
            });
            
            markers.push({ data: market, layer: markerLayer });
            latLngs.push([market.lat, market.lng]);
        });
        
        if (!currentActiveMarket) {
            if (latLngs.length > 1) {
                map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
            } else if (latLngs.length === 1) {
                map.flyTo(latLngs[0], 14);
            }
        }
    }
}

function selectMarket(market) {
    currentActiveMarket = market.id;
    
    // Update Markers
    markers.forEach(m => {
        const isActive = m.data.id === currentActiveMarket;
        m.layer.setIcon(createCustomIcon(m.data.market_type, isActive));
        m.layer.setZIndexOffset(isActive ? 9999 : 100);
    });
    
    // Update List Cards
    document.querySelectorAll('.market-card').forEach(card => {
        if (parseInt(card.dataset.id) === currentActiveMarket) {
            card.classList.add('active-card');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            card.classList.remove('active-card');
        }
    });
    
    // Fly to marker
    map.flyTo([market.lat, market.lng], 15, { duration: 1.5 });
    
    // Populate Detail View
    sdName.textContent = market.name || "Unknown Market";
    sdUnion.textContent = market.union || "Unknown Union";
    
    const isPerm = market.market_type.includes("Permanent") || market.market_type.includes("স্থায়ী");
    sdType.textContent = isPerm ? "Permanent" : "Temporary";
    
    sdShops.textContent = market.shops;
    sdDay.textContent = market.market_day || "Unknown";
    
    let roadStr = market.road_type || "Unknown";
    if (roadStr.includes("(")) roadStr = roadStr.split("(")[0].trim();
    sdRoad.textContent = roadStr;
    
    sdWomen.textContent = `${market.women_presence_percent}%`;
    
    // New fields
    document.getElementById('sd-women-vendors').textContent = `${market.women_vendors_percent}%`;
    
    const sdStorage = document.getElementById('sd-storage');
    sdStorage.innerHTML = "";
    if (market.storage_facilities && market.storage_facilities.length > 0) {
        market.storage_facilities.forEach(facility => {
            const badge = document.createElement('div');
            badge.className = 'product-badge';
            badge.innerHTML = `<i class="fa-solid fa-check text-green"></i> <span>${facility}</span>`;
            sdStorage.appendChild(badge);
        });
    } else {
        sdStorage.innerHTML = '<span class="text-muted" style="font-size:0.85rem">No storage facility data</span>';
    }
    
    const remarksSection = document.getElementById('remarks-section');
    const sdRemarks = document.getElementById('sd-remarks');
    if (market.remarks && market.remarks.trim() !== "") {
        remarksSection.style.display = "block";
        sdRemarks.textContent = market.remarks;
    } else {
        remarksSection.style.display = "none";
    }
    
    if (market.photos && market.photos.length > 0 && market.photos[0].url) {
        sdImage.src = market.photos[0].url;
        sdImage.style.display = "block";
        sdNoImage.style.display = "none";
        sdImageDesc.textContent = market.photos[0].desc || "";
        sdImageDesc.style.display = market.photos[0].desc ? "block" : "none";
    } else {
        sdImage.style.display = "none";
        sdNoImage.style.display = "flex";
        sdImageDesc.style.display = "none";
    }
    
    sdProducts.innerHTML = "";
    if (market.activities && market.activities.length > 0) {
        market.activities.forEach(act => {
            const iconHtml = productIcons[act] || '<i class="fa-solid fa-check"></i>';
            const badge = document.createElement('div');
            badge.className = 'product-badge';
            badge.innerHTML = `${iconHtml} <span>${act}</span>`;
            sdProducts.appendChild(badge);
        });
    } else {
        sdProducts.innerHTML = '<span class="text-muted" style="font-size:0.85rem">No data available</span>';
    }
    
    // Switch View
    viewList.classList.remove('active');
    viewDetail.classList.add('active');
}

btnBack.addEventListener('click', () => {
    viewDetail.classList.remove('active');
    viewList.classList.add('active');
    
    // Deselect
    currentActiveMarket = null;
    renderApp();
});

// Filters
filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = e.target.dataset.filter;
        renderApp();
    });
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderApp();
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});
