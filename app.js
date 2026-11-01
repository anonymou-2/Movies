window.onerror = function(msg, url, line, col, error) {
    document.getElementById('app').innerHTML = `
        <div style="color:red; padding:20px; font-family:monospace; background:#000; min-height:100vh;">
            <h3 style="margin-bottom:10px;">JavaScript Error</h3>
            <p style="margin-bottom:10px; font-size:14px;">${msg}</p>
            <p style="font-size:12px; color:#aaa;">Line: ${line}</p>
            <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#E50914; color:white; border:none; border-radius:4px;">Reload</button>
        </div>
    `;
};

const TMDB_KEY = 'd3f5523547e31eaeb2b23ae2f28ab164';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_BG = 'https://image.tmdb.org/t/p/original';

const app = document.getElementById('app');

// ── Sources ──
const SOURCES = [
    { name: "VidSrc.to", url: id => `https://vidsrc.to/embed/movie/${id}` },
    { name: "VidLink", url: id => `https://vidlink.pro/movie/${id}` },
    { name: "VidFast", url: id => `https://vidfast.pro/movie/${id}` },
    { name: "Embed.su", url: id => `https://embed.su/embed/movie/${id}` },
    { name: "VidSrc.xyz", url: id => `https://vidsrc.xyz/embed/movie?tmdb=${id}` }
];

const TV_SOURCES = [
    { name: "VidSrc.to", url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
    { name: "VidLink", url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
    { name: "VidFast", url: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}` },
    { name: "Embed.su", url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` }
];

// ── API ──
async function api(path, query = {}) {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.append('api_key', TMDB_KEY);
    Object.keys(query).forEach(k => url.searchParams.append(k, query[k]));
    
    // Add cache bust to avoid stale responses if key changes
    url.searchParams.append('_t', Date.now());

    const res = await fetch(url);
    const json = await res.json();
    
    if (!res.ok || json.success === false) {
        throw new Error(json.status_message || `API Error: ${res.status}`);
    }
    return json;
}

// ── UI State ──
let currentView = 'home';
let previousViews = [];

function navigate(view, data = {}) {
    if (currentView && currentView !== view) previousViews.push({ view: currentView, data });
    currentView = view;
    window.scrollTo(0, 0);
    
    if (view === 'home') renderHome();
    else if (view === 'detail') renderDetail(data.id, data.isTv);
}

function goBack() {
    if (previousViews.length > 0) {
        const prev = previousViews.pop();
        currentView = prev.view;
        window.scrollTo(0, 0);
        if (prev.view === 'home') renderHome();
        else if (prev.view === 'detail') renderDetail(prev.data.id, prev.data.isTv);
    }
}

// ── Renderers ──
async function renderHome() {
    app.innerHTML = `
        <div class="topbar">
            <div class="brand">N MOVIES</div>
            <button class="icon-btn" onclick="alert('Search coming soon')">🔍</button>
        </div>
        <div id="home-content"><p style="text-align:center;padding:50px;color:#888;">Loading TMDb...</p></div>
    `;

    try {
        const [trending, popular, tv] = await Promise.all([
            api('/trending/movie/week'),
            api('/movie/popular'),
            api('/trending/tv/week')
        ]);

        const hero = trending?.results?.[0];
        let html = '';

        if (hero) {
            html += `
                <div class="hero">
                    ${hero.backdrop_path ? `<img class="hero-bg" src="${IMG_BG}${hero.backdrop_path}">` : ''}
                    <div class="hero-gradient"></div>
                    <div class="hero-content">
                        <div class="hero-title">${hero.title || 'Unknown'}</div>
                        <div class="hero-btns">
                            <button class="btn-primary" onclick="navigate('detail', {id: ${hero.id}, isTv: false})">▶ Play</button>
                            <button class="btn-secondary" onclick="navigate('detail', {id: ${hero.id}, isTv: false})">ℹ️ Info</button>
                        </div>
                    </div>
                </div>
            `;
        }

        html += buildRow('Trending Movies', trending?.results || [], false);
        html += buildRow('Trending TV', tv?.results || [], true);
        html += buildRow('Popular Movies', popular?.results || [], false);

        document.getElementById('home-content').innerHTML = html;
    } catch (e) {
        document.getElementById('home-content').innerHTML = `
            <div style="color:red;text-align:center;padding:20px;">
                <p>Failed to load data.</p>
                <p style="font-size:12px; margin-top:10px;">${e.message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#E50914; color:white; border:none; border-radius:4px;">Retry</button>
            </div>
        `;
    }
}

function buildRow(title, items, isTv) {
    if (!items || !items.length) return '';
    let cards = items.map(item => {
        const img = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        const name = isTv ? item.name : item.title;
        return `
            <div class="card" onclick="navigate('detail', {id: ${item.id}, isTv: ${isTv}})">
                <img class="poster" src="${img}" loading="lazy">
                <div class="card-title">${name}</div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="row">
            <div class="row-title">${title}</div>
            <div class="rail">${cards}</div>
        </div>
    `;
}

async function renderDetail(id, isTv) {
    app.innerHTML = `<div class="topbar"><button class="icon-btn" onclick="goBack()">←</button></div><p style="text-align:center;padding:50px;color:#888;">Loading...</p>`;

    try {
        const path = isTv ? `/tv/${id}` : `/movie/${id}`;
        const data = await api(path, { append_to_response: 'credits' });
        
        const title = isTv ? data.name : data.title;
        const date = isTv ? data.first_air_date : data.release_date;
        const year = date ? date.split('-')[0] : '';
        const runtime = data.runtime ? `${data.runtime} min` : '';
        const rating = data.vote_average ? `★ ${data.vote_average.toFixed(1)}` : '';
        const genres = data.genres ? data.genres.map(g => g.name).join(' • ') : '';

        let html = `
            <div class="detail-hero">
                ${data.backdrop_path ? `<img src="${IMG_BG}${data.backdrop_path}">` : ''}
                <div class="detail-gradient"></div>
                <div style="position:absolute; top: 20px; left: 20px; z-index:2;">
                    <button class="icon-btn" onclick="goBack()">←</button>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-title">${title || 'Unknown'}</div>
                <div class="detail-meta">${year} ${runtime ? '• '+runtime : ''} ${rating ? '• '+rating : ''}</div>
                <div style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">${genres}</div>
                
                <button class="btn-primary" style="width:100%; justify-content:center;" onclick="openPlayer(${id}, ${isTv}, '${(title || '').replace(/'/g, "\\'")}', 1, 1)">▶ Play</button>
                
                <div class="detail-overview">${data.overview || 'No description available.'}</div>
        `;

        if (isTv && data.seasons) {
            const realSeasons = data.seasons.filter(s => s.season_number > 0);
            html += `<div style="margin-top:30px; font-size:18px; font-weight:bold;">Episodes</div>`;
            
            realSeasons.forEach(s => {
                html += `
                    <div style="margin-top:15px; font-size:16px; font-weight:bold;">Season ${s.season_number}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
                `;
                for (let ep = 1; ep <= s.episode_count; ep++) {
                    html += `<button class="btn-secondary" onclick="openPlayer(${id}, true, '${(title || '').replace(/'/g, "\\'")}', ${s.season_number}, ${ep})">${ep}</button>`;
                }
                html += `</div>`;
            });
        }

        html += `</div>`;
        app.innerHTML = html;

    } catch (e) {
        app.innerHTML = `<div class="topbar"><button class="icon-btn" onclick="goBack()">←</button></div><p style="color:red;text-align:center;padding:50px;">Error: ${e.message}</p>`;
    }
}

// ── Player ──
function openPlayer(id, isTv, title, season = 1, episode = 1) {
    const sources = isTv ? TV_SOURCES : SOURCES;
    const overlay = document.createElement('div');
    overlay.id = 'player-overlay';
    
    overlay.innerHTML = `
        <div class="player-header">
            <button class="icon-btn" onclick="document.getElementById('player-overlay').remove()">←</button>
            <div style="font-size:16px; font-weight:bold;">${title}</div>
            <div style="width:24px;"></div>
        </div>
        <div style="padding:10px; display:flex; gap:10px; overflow-x:auto; background:#111; white-space:nowrap;">
            ${sources.map((s, i) => `<button class="btn-secondary" onclick="setSource('${s.url(id, season, episode)}')" style="font-size:12px; padding:8px 12px;">${s.name}</button>`).join('')}
        </div>
        <iframe id="video-frame" class="player-frame" allow="autoplay; fullscreen; encrypted-media" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"></iframe>
    `;
    
    document.body.appendChild(overlay);
    overlay.style.display = 'flex';
    
    // Set initial source
    const firstUrl = isTv ? sources[0].url(id, season, episode) : sources[0].url(id);
    document.getElementById('video-frame').src = firstUrl;
}

function setSource(url) {
    document.getElementById('video-frame').src = url;
}

// ── BOOT THE APP ──
// THIS WAS THE MISSING LINE!
navigate('home');