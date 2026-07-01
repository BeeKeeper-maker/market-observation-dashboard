// script.js

const initialLat = marketData.length > 0 ? marketData[0].lat : 22.7161;
const initialLng = marketData.length > 0 ? marketData[0].lng : 89.0718;

const map = L.map('map', {
    zoomControl: false
}).setView([initialLat, initialLng], 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Premium Map Tile (Google Maps Hybrid for high-detail village relevance)
L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
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
const btnMapView = document.getElementById('btn-map-view');
const btnNetView = document.getElementById('btn-net-view');
const mapContainer = document.getElementById('map-container');
const netContainer = document.getElementById('network-container');

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
let currentView = 'map';

// Gallery State
let currentPhotos = [];
let currentPhotoIndex = 0;
let carouselInterval = null;

// Gallery DOM Elements
const carouselControls = document.getElementById('carousel-controls');
const carouselIndicators = document.getElementById('carousel-indicators');
const btnPrevImg = document.getElementById('btn-prev-img');
const btnNextImg = document.getElementById('btn-next-img');

// Lightbox DOM Elements
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const btnLightboxClose = document.getElementById('btn-lightbox-close');
const btnLightboxPrev = document.getElementById('btn-lightbox-prev');
const btnLightboxNext = document.getElementById('btn-lightbox-next');

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
    
    // Update Map Context Overlay
    const ctxTotal = document.getElementById('ctx-total-markets');
    if(ctxTotal) ctxTotal.textContent = filteredData.length;
    
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
        
        let validPhotos = [];
        if (market.photos && market.photos.length > 0) {
            validPhotos = market.photos.filter(p => p.url && !Number.isNaN(p.url) && typeof p.url === 'string' && p.url.startsWith('assets/images/'));
        }
        
        let photoHtml = `<div class="card-img"><i class="fa-solid fa-image"></i></div>`;
        if (validPhotos.length > 0) {
            photoHtml = `<img src="${validPhotos[0].url}" class="card-img" alt="Market">`;
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
        
        card.addEventListener('mouseenter', () => {
            const m = markers.find(x => x.data.id === market.id);
            if(m) {
                const pin = m.layer.getElement().querySelector('.marker-pin');
                if(pin) pin.classList.add('hover-highlight');
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const m = markers.find(x => x.data.id === market.id);
            if(m) {
                const pin = m.layer.getElement().querySelector('.marker-pin');
                if(pin) pin.classList.remove('hover-highlight');
            }
        });
        
        marketListEl.appendChild(card);
    });
}

// Global to store network line
let networkLineLayer = null;

function renderMarkers(dataToRender) {
    markers.forEach(m => map.removeLayer(m.layer));
    markers = [];
    
    if(networkLineLayer) {
        map.removeLayer(networkLineLayer);
        networkLineLayer = null;
    }
    
    if (dataToRender.length > 0) {
        const latLngs = [];
        
        dataToRender.forEach((market, index) => {
            const isActive = currentActiveMarket === market.id;
            
            // Generate a deterministic jitter to avoid exact overlapping
            const seed = market.id;
            const jitterLat = (Math.sin(seed) * 0.0003); 
            const jitterLng = (Math.cos(seed) * 0.0003);
            
            const markerLayer = L.marker([market.lat + jitterLat, market.lng + jitterLng], {
                icon: createCustomIcon(market.market_type, isActive),
                zIndexOffset: isActive ? 9999 : (1000 - index)
            }).addTo(map);
            
            markerLayer.bindTooltip(`<b>${market.name}</b>`, {
                direction: 'right',
                permanent: true,
                offset: [15, 0],
                className: 'permanent-tooltip'
            });
            
            markerLayer.on('click', () => {
                selectMarket(market);
            });
            
            markers.push({ data: market, layer: markerLayer });
            latLngs.push([market.lat, market.lng]);
        });
        
        if (!currentActiveMarket) {
            if (latLngs.length > 1) {
                map.flyToBounds(L.latLngBounds(latLngs), { padding: [80, 80], duration: 2 });
            } else if (latLngs.length === 1) {
                map.flyTo(latLngs[0], 14, { duration: 2 });
            }
        }
        
        // Draw the Ecosystem Network Line
        if (latLngs.length > 1) {
            // Sort by longitude to make a clean path
            const sortedLatLngs = [...latLngs].sort((a,b) => a[1] - b[1]);
            networkLineLayer = L.polyline(sortedLatLngs, {
                color: '#3b82f6',
                weight: 2,
                dashArray: '8, 12',
                opacity: 0.6,
                lineCap: 'round',
                className: 'animated-network-line'
            }).addTo(map);
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
    
    // Setup Photos for Carousel
    currentPhotos = [];
    currentPhotoIndex = 0;
    
    if (market.photos && market.photos.length > 0) {
        // Filter out photos that have 'url': NaN
        currentPhotos = market.photos.filter(p => p.url && !Number.isNaN(p.url));
    } else {
        stopCarouselAutoSlide();
    }
    
    updateCarousel();
    
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

// View Toggle Logic
// 'map' or 'network'

btnMapView.addEventListener('click', () => {
    if(currentView === 'map') return;
    currentView = 'map';
    btnMapView.classList.add('active');
    btnNetView.classList.remove('active');
    mapContainer.classList.add('active-layer');
    netContainer.classList.remove('active-layer');
});

btnNetView.addEventListener('click', () => {
    if(currentView === 'network') return;
    currentView = 'network';
    btnNetView.classList.add('active');
    btnMapView.classList.remove('active');
    netContainer.classList.add('active-layer');
    mapContainer.classList.remove('active-layer');
    
    // Render Network View if it hasn't been rendered yet or needs update
    renderNetworkView();
});

// D3 Network View Logic
let networkRendered = false;

function renderNetworkView() {
    const container = d3.select("#network-container");
    container.selectAll("*").remove(); // Clear previous
    
    const containerNode = container.node();
    const width = containerNode ? (containerNode.clientWidth || 800) : 800;
    const height = containerNode ? (containerNode.clientHeight || 600) : 600;
    
    // Prepare Data Hierarchy
    const unionsMap = {};
    marketData.forEach(market => {
        // Apply current filters to network view as well
        const matchesFilter = activeFilter === 'all' || market.market_type === activeFilter;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = market.name.toLowerCase().includes(searchLower) || market.union.toLowerCase().includes(searchLower);
        
        if(!matchesFilter || !matchesSearch) return;

        if(!unionsMap[market.union]) {
            unionsMap[market.union] = [];
        }
        unionsMap[market.union].push(market);
    });
    
    const nodes = [];
    const links = [];
    
    // Root Node
    nodes.push({ id: 'root', group: 'root', radius: 40, name: "Gopalganj", sub: "Market Ecosystem" });
    
    Object.keys(unionsMap).forEach(union => {
        const unionId = 'union_' + union;
        nodes.push({ id: unionId, group: 'union', radius: 110, name: union, sub: "Union" });
        links.push({ source: 'root', target: unionId, distance: 280 }); // Adjusted to fit in one screen
        
        unionsMap[union].forEach(market => {
            nodes.push({ 
                id: market.id, 
                group: 'market', 
                radius: 15, 
                name: market.name,
                marketData: market,
                type: market.market_type 
            });
            links.push({ source: unionId, target: market.id, distance: 130 });
        });
    });
    
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);
        
    // SVG Definitions for Premium Gradients
    const defs = svg.append("defs");
    
    // Root Gradient (Cyan)
    const rootGrad = defs.append("radialGradient").attr("id", "rootGradient");
    rootGrad.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8");
    rootGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0284c7");
    
    // Union Gradient (Purple)
    const unionGrad = defs.append("radialGradient").attr("id", "unionGradient");
    unionGrad.append("stop").attr("offset", "0%").attr("stop-color", "#c084fc");
    unionGrad.append("stop").attr("offset", "100%").attr("stop-color", "#7e22ce");

    // Perm Market Gradient (Blue)
    const permGrad = defs.append("radialGradient").attr("id", "permGradient");
    permGrad.append("stop").attr("offset", "0%").attr("stop-color", "#60a5fa");
    permGrad.append("stop").attr("offset", "100%").attr("stop-color", "#2563eb");
    
    // Temp Market Gradient (Orange)
    const tempGrad = defs.append("radialGradient").attr("id", "tempGradient");
    tempGrad.append("stop").attr("offset", "0%").attr("stop-color", "#fbbf24");
    tempGrad.append("stop").attr("offset", "100%").attr("stop-color", "#d97706");
        
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.distance))
        .force("charge", d3.forceManyBody().strength(d => d.group === 'root' ? -2000 : (d.group === 'union' ? -800 : -400)))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(d => {
            if(d.group === 'union') {
                if(d.name.includes('Jalirpar') || d.name.includes('জলিরপাড়')) return width / 2 - 280;
                if(d.name.includes('Nonikhir') || d.name.includes('ননীক্ষীর')) return width / 2 + 280;
            }
            return width / 2;
        }).strength(d => d.group === 'union' ? 0.3 : 0.05))
        .force("y", d3.forceY(d => {
            if(d.group === 'union') {
                if(d.name.includes('Jalirpar') || d.name.includes('জলিরপাড়')) return height / 2 - 180;
                if(d.name.includes('Nonikhir') || d.name.includes('ননীক্ষীর')) return height / 2 + 180;
            }
            return height / 2;
        }).strength(d => d.group === 'union' ? 0.3 : 0.05))
        .force("radial", d3.forceRadial(d => {
            // Push market nodes to the outer edges to prevent crowding the center
            if(d.group === 'market') return 350;
            return 0;
        }, width / 2, height / 2).strength(d => d.group === 'market' ? 0.8 : 0))
        .force("collide", d3.forceCollide().radius(d => {
            if(d.group === 'root') return 200;
            if(d.group === 'union') return 120;
            return 80;
        }).iterations(4));
        
    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", d => `link-line ${d.source.group === 'root' ? 'data-flow-primary' : 'data-flow-secondary'}`)
        .attr("stroke-width", d => d.source.group === 'root' ? 3 : 2)
        .attr("fill", "none");
        
    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));
        
    // Standard Nodes (Unions & Markets)
    const marketNodes = node.filter(d => d.group === 'market');
    const unionNodes = node.filter(d => d.group === 'union');

    // Interactive Market Image Badges
    marketNodes.append("foreignObject")
        .attr("x", -70)
        .attr("y", -50)
        .attr("width", 140)
        .attr("height", 100)
        .style("overflow", "visible")
        .append("xhtml:div")
        .attr("class", "market-badge-container")
        .html(d => {
            const isPerm = d.type && (d.type.includes("Permanent") || d.type.includes("স্থায়ী"));
            const color = isPerm ? '#38bdf8' : '#fbbf24';
            const photos = d.marketData.photos || [];
            const displayImages = photos.map(p => p.url).slice(0, 3); // Max 3 images
            
            let imagesHtml = '';
            if (displayImages.length > 0) {
                imagesHtml = `<div class="market-gallery-preview">` + 
                    displayImages.map(src => `<img src="${src}" class="gallery-thumb" onerror="this.style.display='none'"/>`).join('') +
                    `</div>`;
            } else {
                imagesHtml = `
                <div class="market-badge-icon" style="border-color: ${color}; box-shadow: 0 0 10px ${color}66; position: relative;">
                    <i class="fa-solid fa-store" style="color: ${color}; position: absolute; z-index: 0;"></i>
                </div>`;
            }

            return `
                ${imagesHtml}
                <div class="market-badge-label" style="border-top: 3px solid ${color};">
                    <span class="market-name">${d.name}</span>
                </div>
            `;
        })
        .on("click", (event, d) => {
            selectMarket(d.marketData);
        });
        
    // Custom Image Nodes for Unions
    unionNodes.append("image")
        .attr("xlink:href", d => {
            if(d.name.toLowerCase().includes('jalirpar') || d.name.includes('জলিরপাড়')) return 'assets/images/unions/jalirpar.png';
            if(d.name.toLowerCase().includes('nonikhir') || d.name.includes('ননীক্ষীর')) return 'assets/images/unions/nonikhir.png';
            return '';
        })
        .attr("x", d => -d.radius - 20)
        .attr("y", d => -d.radius - 20)
        .attr("width", d => (d.radius + 20) * 2)
        .attr("height", d => (d.radius + 20) * 2)
        .attr("class", "union-node-img");
        
    // Beautiful Glassmorphism Badge for Unions
    unionNodes.append("foreignObject")
        .attr("x", -100)
        .attr("y", -30) // Centered directly on the map
        .attr("width", 200)
        .attr("height", 60)
        .style("pointer-events", "none")
        .append("xhtml:div")
        .attr("class", "union-badge")
        .html(d => `
            <div class="union-badge-name">${d.name}</div>
            <div class="union-badge-sub">UNION MAP</div>
        `);
        

    
    // Premium Root Node with Prominent Map
    const rootNode = node.filter(d => d.group === 'root');
    
    rootNode.append("image")
        .attr("xlink:href", "assets/images/unions/muksudpur.png")
        .attr("x", -320)
        .attr("y", -320)
        .attr("width", 640)
        .attr("height", 640)
        .attr("class", "root-node-img")
        .style("pointer-events", "none");

    rootNode.append("g")
        .attr("transform", "translate(-250, -130)")
        .append("foreignObject")
        .attr("width", 500)
        .attr("height", 260)
        .append("xhtml:div")
        .attr("class", "d3-root-content")
        .html(d => `
            <div class="logos-container">
                <img src="assets/images/partners-logo.png" alt="Partners Logo" class="partners-logo">
            </div>
            <span class="badge">MUKSUDPUR UPAZILA, GOPALGANJ</span>
            <h3>Market System & Value Chain Assessment for (SLPFIVCD-II)</h3>
        `);
        
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // multiplier for curve steepness
            
            // Generate a curved arc path
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        node.attr("transform", d => `translate(${Math.max(d.radius, Math.min(width - d.radius, d.x))},${Math.max(d.radius, Math.min(height - d.radius, d.y))})`);
    });
    
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

// Modify renderApp to also update network view if active
const originalRenderApp = renderApp;
renderApp = function() {
    originalRenderApp();
    if(currentView === 'network') {
        renderNetworkView();
    }
};

// Modify selectMarket to also highlight D3 nodes
const originalSelectMarket = selectMarket;
selectMarket = function(market) {
    originalSelectMarket(market);
    if(currentView === 'network') {
        d3.selectAll('.node-circle').classed('node-active', d => d.id === market.id);
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});

// ----------------- GALLERY / CAROUSEL LOGIC -----------------
function updateCarousel() {
    if (currentPhotos.length > 0) {
        const photo = currentPhotos[currentPhotoIndex];
        sdImage.src = photo.url;
        sdImage.style.display = 'block';
        sdNoImage.style.display = 'none';
        
        if (photo.desc) {
            sdImageDesc.textContent = photo.desc;
            sdImageDesc.style.display = 'block';
        } else {
            sdImageDesc.style.display = 'none';
        }
        
        // Setup Controls
        if (currentPhotos.length > 1) {
            if(carouselControls) carouselControls.style.display = 'flex';
            if(carouselIndicators) carouselIndicators.style.display = 'flex';
            
            // Build dots
            if (carouselIndicators) {
                carouselIndicators.innerHTML = '';
                currentPhotos.forEach((_, idx) => {
                    const dot = document.createElement('div');
                    dot.className = `carousel-dot ${idx === currentPhotoIndex ? 'active' : ''}`;
                    dot.onclick = (e) => {
                        e.stopPropagation();
                        currentPhotoIndex = idx;
                        updateCarousel();
                    };
                    carouselIndicators.appendChild(dot);
                });
            }
            startCarouselAutoSlide(); // Start/restart interval
        } else {
            if(carouselControls) carouselControls.style.display = 'none';
            if(carouselIndicators) carouselIndicators.style.display = 'none';
            stopCarouselAutoSlide();
        }
    } else {
        sdImage.style.display = 'none';
        sdImageDesc.style.display = 'none';
        sdNoImage.style.display = 'flex';
        if(carouselControls) carouselControls.style.display = 'none';
        if(carouselIndicators) carouselIndicators.style.display = 'none';
        stopCarouselAutoSlide();
    }
}

function startCarouselAutoSlide() {
    stopCarouselAutoSlide();
    if (currentPhotos.length > 1) {
        carouselInterval = setInterval(() => {
            // Only auto-slide if lightbox is NOT open
            if (!lightboxOverlay || lightboxOverlay.style.display !== 'flex') {
                currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
                updateCarousel();
            }
        }, 3000); // 3 seconds
    }
}

function stopCarouselAutoSlide() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function nextPhoto(e) {
    if(e) e.stopPropagation();
    if(currentPhotos.length > 1) {
        currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
        updateCarousel();
        if(lightboxOverlay && lightboxOverlay.style.display === 'flex') updateLightbox();
    }
}

function prevPhoto(e) {
    if(e) e.stopPropagation();
    if(currentPhotos.length > 1) {
        currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
        updateCarousel();
        if(lightboxOverlay && lightboxOverlay.style.display === 'flex') updateLightbox();
    }
}

function updateLightbox() {
    if(currentPhotos.length > 0 && lightboxImg) {
        lightboxImg.src = currentPhotos[currentPhotoIndex].url;
        if(lightboxCaption) lightboxCaption.textContent = currentPhotos[currentPhotoIndex].desc || '';
    }
}

function openLightbox() {
    if(currentPhotos.length > 0 && lightboxOverlay) {
        updateLightbox();
        lightboxOverlay.style.display = 'flex';
    }
}

function closeLightbox() {
    if(lightboxOverlay) lightboxOverlay.style.display = 'none';
}

// Event Listeners for Gallery
if(btnPrevImg) btnPrevImg.addEventListener('click', prevPhoto);
if(btnNextImg) btnNextImg.addEventListener('click', nextPhoto);
if(sdImage) sdImage.addEventListener('click', openLightbox);

if(btnLightboxClose) btnLightboxClose.addEventListener('click', closeLightbox);
if(btnLightboxNext) btnLightboxNext.addEventListener('click', nextPhoto);
if(btnLightboxPrev) btnLightboxPrev.addEventListener('click', prevPhoto);
if(lightboxOverlay) {
    lightboxOverlay.addEventListener('click', (e) => {
        if(e.target === lightboxOverlay) closeLightbox();
    });
}
// ------------------------------------------------------------
