// Data Cache to prevent double requests
const dataCache = {};

async function fetchJSON(url) {
  if (dataCache[url]) return dataCache[url];
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.statusText}`);
    const data = await response.json();
    dataCache[url] = data;
    return data;
  } catch (error) {
    console.error('Error fetching JSON data:', error);
    return null;
  }
}

// Router configuration
const appView = document.getElementById('app-view');
let currentActiveRoute = '';
let previousNonSearchHash = '#home';

// Map hash routes to view render functions
const routes = {
  'home': renderHome,
  'projects': renderProjects,
  'agents': renderAgents,
  'anime': renderAnime,
  'contact': renderContact,
  'privacy': renderPrivacy,
  '404': render404
};

// URL Hash Parser
function parseHash() {
  const hash = window.location.hash || '#home';
  const parts = hash.split('?');
  const route = parts[0].substring(1);
  const query = {};
  if (parts[1]) {
    parts[1].split('&').forEach(param => {
      const [key, val] = param.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }
  return { route, query };
}

// Main Routing Handler
async function handleRouting() {
  // Close mobile overlay menu
  const overlay = document.getElementById('mobile-more-overlay');
  if (overlay) overlay.style.display = 'none';
  
  // Close mobile drawer / sidebars if any
  document.body.classList.remove('sidebar-open');

  const { route, query } = parseHash();
  const renderFn = routes[route] || routes['404'];
  
  // Keep track of navigation hash for search cancellation
  if (route !== 'search') {
    previousNonSearchHash = window.location.hash || '#home';
  }

  // Highlight active sidebar navigation link
  document.querySelectorAll('.nav-item-link').forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Highlight active bottom navigation link
  document.querySelectorAll('.bottom-nav-item').forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Clear search field unless we're on a search route
  const searchInput = document.getElementById('global-search');
  if (searchInput && route !== 'search') {
    searchInput.value = '';
  }

  currentActiveRoute = route;
  appView.innerHTML = `
    <div class="anime-loader">
      <div class="ripple-circle"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem; font-family: 'Noto Serif JP', serif;">Water Breathing: Routing Technique...</p>
    </div>
  `;

  try {
    window.scrollTo({ top: 0 });
    await renderFn(query);
  } catch (err) {
    console.error('Routing render error:', err);
    appView.innerHTML = `
      <div class="card" style="margin: 2rem auto; max-width: 500px; text-align: center; border-color: var(--error);">
        <h3 style="color: var(--error); margin-bottom: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Breathing Interruption</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">An error occurred while compiling this view.</p>
        <button class="btn btn-primary" onclick="window.location.hash = '#home'">Go back Home</button>
      </div>
    `;
  }
}

// 1. HOME VIEW
async function renderHome() {
  const profile = await fetchJSON('data/profile.json');
  const resume = await fetchJSON('data/resume.json');

  if (!profile || !resume) return;

  const statsHTML = profile.statistics ? profile.statistics.map(stat => `
    <div class="stat-card">
      <div class="stat-value">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join('') : '';

  // Timeline render (styled with rippling Water Breathing checkpoints)
  const timelineHTML = resume.experience.map((exp, index) => `
    <div class="timeline-item">
      <div class="timeline-badge" style="border-color: ${index === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'};"></div>
      <div class="timeline-header">
        <div>
          <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700;">${exp.role}</h4>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-secondary);">${exp.company}</span>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-secondary" style="font-size:0.65rem;">${exp.period}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;"><i class="fas fa-map-marker-alt"></i> ${exp.location}</div>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">${exp.description}</p>
      <ul class="timeline-bullets" style="margin-top: 0.5rem; padding-left: 1.25rem;">
        ${exp.bullet_points.map(pt => `<li style="font-size: 0.825rem; margin-bottom: 0.25rem;">${pt}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  // Core skills categories
  const skillsHTML = resume.skills.map(cat => `
    <div class="card card-flame" style="border-color: var(--border-color); padding: 1.25rem;">
      <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.35rem; color: var(--accent-primary);"><i class="fas fa-scroll"></i> ${cat.category}</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
        ${cat.items.map(skill => `<span class="badge badge-muted">${skill}</span>`).join('')}
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <div class="hero">
      <p class="hero-subtitle">Specialist Software Engineer | Platform & DevOps</p>
      <h1 class="hero-title">${profile.name}</h1>
      <p class="hero-text">${profile.summary}</p>
      
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 2rem;">
        <a href="#contact" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Connect With Me</a>
        <a href="${profile.socials.linkedin}" target="_blank" class="btn"><i class="fab fa-linkedin"></i> LinkedIn</a>
        <a href="${profile.socials.medium}" target="_blank" class="btn"><i class="fab fa-medium"></i> Medium</a>
        <a href="${profile.socials.github}" target="_blank" class="btn"><i class="fab fa-github"></i> GitHub</a>
      </div>
    </div>

    <div class="stats-grid">
      ${statsHTML}
    </div>

    <!-- Double Column for Resume (Experience & Skills) -->
    <div style="display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 2.5rem; margin-top: 1rem;">
      <!-- Experience -->
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Professional Slashes (Experience)</h2>
        </div>
        <div class="timeline">
          ${timelineHTML}
        </div>
      </div>

      <!-- Skills & Education -->
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Breathing Techniques (Skills)</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${skillsHTML}
        </div>

        <div class="section-header" style="margin-top: 2rem;">
          <h2 class="section-title">Education</h2>
        </div>
        <div class="card" style="padding: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem;">${resume.education[0].degree}</h4>
          <p style="font-size: 0.85rem; color: var(--accent-secondary); font-weight: 600; margin-bottom: 0.25rem;">${resume.education[0].institution}</p>
          <span class="badge badge-muted" style="align-self: flex-start;">${resume.education[0].period}</span>
        </div>
      </div>
    </div>
  `;
}

// 2. PROJECTS VIEW
async function renderProjects(query) {
  const projects = await fetchJSON('data/projects.json');
  if (!projects) return;

  const activeFilter = query.filter || 'All';
  const filters = ['All', 'Production', 'Active', 'Beta'];

  const filterButtonsHTML = filters.map(f => `
    <a href="#projects?filter=${f}" class="btn ${activeFilter === f ? 'btn-primary' : ''}" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
      ${f}
    </a>
  `).join('');

  const filteredProjects = projects.filter(p => activeFilter === 'All' || p.status === activeFilter);

  const projectsHTML = filteredProjects.map((p, index) => `
    <div class="card" style="border-color: var(--border-color);">
      <div class="card-header">
        <div>
          <h3 class="card-title">${p.name}</h3>
          <span class="badge ${p.status === 'Production' ? 'badge-success' : 'badge-secondary'}" style="margin-top: 0.25rem;">${p.status}</span>
        </div>
        <div style="display: flex; gap: 0.4rem;">
          <a href="${p.repo}" target="_blank" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fab fa-github"></i> Code</a>
        </div>
      </div>
      
      <p class="card-body">${p.description}</p>
      
      <!-- Accordion details for Architecture and Lessons -->
      <div style="margin-bottom: 1rem; font-size: 0.825rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
        <button class="btn" style="width: 100%; text-align: left; justify-content: space-between; border: none; padding: 0.35rem 0; background:none;" onclick="toggleAccordion('proj-arch-${index}')">
          <span><i class="fas fa-network-wired" style="color: var(--accent-secondary); margin-right:0.25rem;"></i> System Architecture</span>
          <i class="fas fa-chevron-down" id="proj-arch-${index}-icon"></i>
        </button>
        <div id="proj-arch-${index}" style="display: none; padding: 0.25rem 0 0.5rem; color: var(--text-muted); line-height: 1.4;">
          ${p.architecture}
        </div>

        <button class="btn" style="width: 100%; text-align: left; justify-content: space-between; border: none; padding: 0.35rem 0; margin-top: 0.15rem; background:none;" onclick="toggleAccordion('proj-less-${index}')">
          <span><i class="fas fa-scroll" style="color: var(--accent-primary); margin-right:0.25rem;"></i> Lessons Learned</span>
          <i class="fas fa-chevron-down" id="proj-less-${index}-icon"></i>
        </button>
        <div id="proj-less-${index}" style="display: none; padding: 0.25rem 0 0.5rem; color: var(--text-muted); line-height: 1.4; font-style: italic;">
          ${p.lessons}
        </div>
      </div>

      <div class="card-footer" style="padding: 0; margin: 0;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
          ${p.technology.map(tech => `<span class="badge badge-muted">${tech}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 0.5rem;">Technical Slashes (Projects)</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">A breakdown of operational scripts, dashboard tools, and automated infrastructure frameworks.</p>
    
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.75rem; flex-wrap: wrap;">
      ${filterButtonsHTML}
    </div>

    <div class="grid grid-cols-2">
      ${projectsHTML.length > 0 ? projectsHTML : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No projects found under this breathing style.</p>'}
    </div>
  `;
}

// 3. TOP 100 COPILOT/ANTHROPIC AGENTS VIEW
async function renderAgents(query) {
  const agents = await fetchJSON('data/agents.json');
  if (!agents) return;

  const activeCategory = query.category || 'All';
  const categories = [
    'All',
    'Coding Assistants',
    'Autonomous Dev Agents',
    'MCP Servers',
    'Multi-Agent Frameworks',
    'Specialized Copilots'
  ];

  const searchVal = (query.search || '').trim().toLowerCase();

  const filterButtonsHTML = categories.map(c => `
    <a href="#agents?category=${encodeURIComponent(c)}&search=${encodeURIComponent(searchVal)}" class="btn ${activeCategory === c ? 'btn-primary' : ''}" style="font-size: 0.775rem; padding: 0.35rem 0.7rem; border-radius: 6px;">
      ${c}
    </a>
  `).join('');

  // Filter logic
  let filteredAgents = agents;
  if (activeCategory !== 'All') {
    filteredAgents = filteredAgents.filter(a => a.category === activeCategory);
  }
  if (searchVal) {
    filteredAgents = filteredAgents.filter(a => 
      a.name.toLowerCase().includes(searchVal) ||
      a.desc.toLowerCase().includes(searchVal) ||
      a.developer.toLowerCase().includes(searchVal)
    );
  }

  const agentsHTML = filteredAgents.map(a => `
    <div class="card" style="border-color: var(--border-color); padding: 1.25rem;">
      <div class="card-header">
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin:0 0 0.15rem;">${a.name}</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">By ${a.developer}</span>
        </div>
        <span class="badge badge-secondary" style="font-size: 0.65rem;">${a.category}</span>
      </div>
      <p class="card-body" style="font-size: 0.85rem; margin-bottom: 1.25rem; line-height:1.4;">${a.desc}</p>
      <div class="card-footer" style="margin-top:auto; padding:0;">
        <span></span>
        <a href="${a.link}" target="_blank" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fas fa-external-link-alt"></i> Source Repository</a>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 0.5rem;">Awesome Copilot & Anthropic Agents</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">A curated directory of top 100 AI agents, IDE extensions, Multi-agent orchestrators, and MCP servers.</p>

    <!-- Sub-Search Bar and Filters -->
    <div style="background-color: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.75rem;">
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div style="flex-grow: 1; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
          <input type="text" id="agents-search-input" class="form-control" placeholder="Search agents by name, tag, or description..." style="padding-left: 2rem;" value="${searchVal}">
        </div>
        <button class="btn btn-primary" onclick="triggerAgentsSearch()"><i class="fas fa-search"></i> Search</button>
      </div>
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
        ${filterButtonsHTML}
      </div>
    </div>

    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; font-weight: 600;">
      Displaying ${filteredAgents.length} of 100 curated agents
    </div>

    <div class="grid grid-cols-3">
      ${agentsHTML.length > 0 ? agentsHTML : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No AI agents match your query or category selection.</p>'}
    </div>
  `;

  // Attach search enter key event
  const subSearchInput = document.getElementById('agents-search-input');
  if (subSearchInput) {
    subSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        triggerAgentsSearch();
      }
    });
  }
}

// Trigger local search for agents view
window.triggerAgentsSearch = function() {
  const searchVal = document.getElementById('agents-search-input').value.trim();
  const { query } = parseHash();
  const category = query.category || 'All';
  window.location.hash = `#agents?category=${encodeURIComponent(category)}&search=${encodeURIComponent(searchVal)}`;
};

// 4. TOP 100 ANIME VIEW
async function renderAnime(query) {
  const animeData = await fetchJSON('data/anime.json');
  if (!animeData) return;

  const activeGenre = query.genre || 'All';
  const activeType = query.type || 'All';
  const activeSort = query.sort || 'rank'; // 'rank' or 'score'
  const searchVal = (query.search || '').trim().toLowerCase();
  
  // Pagination (displays 24 at a time with a load more button)
  const limit = parseInt(query.limit || '24');

  // Distinct genres list
  const genres = ['All', 'Action', 'Adventure', 'Fantasy', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Sports', 'Slice of Life'];
  const types = ['All', 'TV', 'Movie', 'OVA'];

  // Filters logic
  let filteredAnime = animeData;
  if (activeGenre !== 'All') {
    filteredAnime = filteredAnime.filter(a => a.genre.includes(activeGenre));
  }
  if (activeType !== 'All') {
    filteredAnime = filteredAnime.filter(a => a.type === activeType);
  }
  if (searchVal) {
    filteredAnime = filteredAnime.filter(a => 
      a.title.toLowerCase().includes(searchVal) ||
      a.japanese.toLowerCase().includes(searchVal) ||
      a.synopsis.toLowerCase().includes(searchVal) ||
      a.studio.toLowerCase().includes(searchVal)
    );
  }

  // Sort logic
  if (activeSort === 'score') {
    filteredAnime.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
  } else {
    filteredAnime.sort((a, b) => a.rank - b.rank);
  }

  const paginatedAnime = filteredAnime.slice(0, limit);

  const animeHTML = paginatedAnime.map(a => `
    <div class="card" style="border-color: var(--border-color); padding: 1.25rem;">
      <div class="card-header" style="margin-bottom: 0.5rem;">
        <div>
          <span class="badge badge-primary" style="font-size:0.65rem; margin-bottom:0.25rem;">Rank #${a.rank}</span>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin:0 0 0.15rem;">${a.title}</h4>
          <span style="font-size: 0.775rem; color: var(--text-muted); font-family: 'Noto Serif JP', serif;">${a.japanese}</span>
        </div>
        <span class="badge badge-warning" style="font-size: 0.65rem; white-space: nowrap;"><i class="fas fa-star" style="margin-right: 0.2rem;"></i> ${a.score}</span>
      </div>
      
      <p class="card-body" style="font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.4;">${a.synopsis}</p>
      
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
        <strong>Studio:</strong> ${a.studio} | <strong>Type:</strong> ${a.type} (${a.episodes} eps)
      </div>

      <div class="card-footer" style="padding: 0; margin: 0;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.2rem;">
          ${a.genre.split(', ').map(g => `<span class="badge badge-muted" style="font-size: 0.65rem;">${g}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  const loadMoreBtnHTML = filteredAnime.length > limit ? `
    <div style="display: flex; justify-content: center; margin-top: 2rem;">
      <a href="#anime?genre=${encodeURIComponent(activeGenre)}&type=${encodeURIComponent(activeType)}&sort=${activeSort}&search=${encodeURIComponent(searchVal)}&limit=${limit + 24}" class="btn btn-primary" style="font-size: 0.9rem; padding: 0.5rem 1.5rem;"><i class="fas fa-plus"></i> Load More Slayers</a>
    </div>
  ` : '';

  appView.innerHTML = `
    <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 0.5rem;">Kimetsu Rankings (Top 100 Anime)</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">A master list of the top 100 anime series compiled from MyAnimeList and popular databases on the web.</p>

    <!-- Interactive Filtering & Sorting Panel -->
    <div style="background-color: var(--bg-secondary); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.75rem;">
      <!-- Search Input -->
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div style="flex-grow: 1; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
          <input type="text" id="anime-search-input" class="form-control" placeholder="Search anime by title, studio, or Japanese name..." style="padding-left: 2rem;" value="${searchVal}">
        </div>
        <button class="btn btn-primary" onclick="triggerAnimeSearch()"><i class="fas fa-search"></i> Search</button>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; align-items: center;">
        <!-- Filters -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 0.75rem; font-weight:600; color: var(--text-muted); text-transform: uppercase;">Genre:</span>
            ${genres.slice(0, 7).map(g => `<a href="#anime?genre=${encodeURIComponent(g)}&type=${encodeURIComponent(activeType)}&sort=${activeSort}&search=${encodeURIComponent(searchVal)}" class="filter-btn ${activeGenre === g ? 'active' : ''}">${g}</a>`).join('')}
          </div>
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; margin-top: 0.25rem;">
            <span style="font-size: 0.75rem; font-weight:600; color: var(--text-muted); text-transform: uppercase;">Type:</span>
            ${types.map(t => `<a href="#anime?genre=${encodeURIComponent(activeGenre)}&type=${encodeURIComponent(t)}&sort=${activeSort}&search=${encodeURIComponent(searchVal)}" class="filter-btn ${activeType === t ? 'active' : ''}">${t}</a>`).join('')}
          </div>
        </div>

        <!-- Sort dropdown -->
        <div>
          <label style="font-size: 0.75rem; font-weight:600; color: var(--text-muted); text-transform: uppercase; margin-right: 0.5rem;">Sort By:</label>
          <select id="anime-sort-select" class="sort-select" onchange="triggerAnimeSort(this.value)">
            <option value="rank" ${activeSort === 'rank' ? 'selected' : ''}>Rank (MAL Default)</option>
            <option value="score" ${activeSort === 'score' ? 'selected' : ''}>Rating (Highest First)</option>
          </select>
        </div>
      </div>
    </div>

    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; font-weight: 600;">
      Displaying ${paginatedAnime.length} of ${filteredAnime.length} matching anime
    </div>

    <div class="grid grid-cols-3">
      ${animeHTML.length > 0 ? animeHTML : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No anime found matching your selection.</p>'}
    </div>

    ${loadMoreBtnHTML}
  `;

  // Attach search enter key event
  const subSearchInput = document.getElementById('anime-search-input');
  if (subSearchInput) {
    subSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        triggerAnimeSearch();
      }
    });
  }
}

// Trigger local search for anime view
window.triggerAnimeSearch = function() {
  const searchVal = document.getElementById('anime-search-input').value.trim();
  const { query } = parseHash();
  const genre = query.genre || 'All';
  const type = query.type || 'All';
  const sort = query.sort || 'rank';
  window.location.hash = `#anime?genre=${encodeURIComponent(genre)}&type=${encodeURIComponent(type)}&sort=${sort}&search=${encodeURIComponent(searchVal)}`;
};

// Trigger sort for anime view
window.triggerAnimeSort = function(sortVal) {
  const { query } = parseHash();
  const genre = query.genre || 'All';
  const type = query.type || 'All';
  const searchVal = query.search || '';
  window.location.hash = `#anime?genre=${encodeURIComponent(genre)}&type=${encodeURIComponent(type)}&sort=${sortVal}&search=${encodeURIComponent(searchVal)}`;
};

// 5. CONTACT VIEW
async function renderContact() {
  const profile = await fetchJSON('data/profile.json');
  if (!profile) return;

  appView.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 0.5rem;">Send a Scroll (Contact)</h1>
      <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Have an interesting project, automation challenge, or collaboration ideas? Drop a message below.</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2.5rem;">
        <!-- Contact details -->
        <div>
          <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
            <h4 style="margin-bottom: 0.75rem; font-family: 'Noto Serif JP', serif;">Location & Delivery</h4>
            <p style="font-size: 0.85rem; margin-bottom: 0.5rem;"><i class="fas fa-envelope" style="color: var(--accent-primary); margin-right: 0.5rem;"></i> ${profile.socials.email}</p>
            <p style="font-size: 0.85rem;"><i class="fas fa-map-marker-alt" style="color: var(--accent-primary); margin-right: 0.5rem;"></i> ${profile.socials.location}</p>
          </div>

          <div class="card" style="padding: 1.25rem;">
            <h4 style="margin-bottom: 0.75rem; font-family: 'Noto Serif JP', serif;">Social Channels</h4>
            <div style="display: flex; gap: 0.75rem; font-size: 1.35rem; margin-top: 0.5rem;">
              <a href="${profile.socials.linkedin}" target="_blank" aria-label="LinkedIn" style="color: var(--accent-secondary);"><i class="fab fa-linkedin"></i></a>
              <a href="${profile.socials.github}" target="_blank" aria-label="GitHub" style="color: var(--text-primary);"><i class="fab fa-github"></i></a>
              <a href="${profile.socials.medium}" target="_blank" aria-label="Medium" style="color: var(--accent-primary);"><i class="fab fa-medium"></i></a>
              <a href="${profile.socials.instagram}" target="_blank" aria-label="Instagram" style="color: #e1306c;"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="card" style="padding: 1.25rem;">
          <form action="https://formspree.io/myywaaby" method="POST" id="contact-form">
            <div class="form-group">
              <label class="form-label" for="sender-name">Slayer's Name</label>
              <input type="text" name="name" class="form-control" id="sender-name" required placeholder="Kamado Tanjiro">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="sender-email">Reply Address</label>
              <input type="email" name="_replyto" class="form-control" id="sender-email" required placeholder="tanjiro@demonslayer.com">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="sender-msg">Scroll Content (Message)</label>
              <textarea name="message" class="form-control" id="sender-msg" required placeholder="Greetings, I seek help with my CI/CD breathing style..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 0.9rem; padding: 0.55rem 0;"><i class="fas fa-paper-plane"></i> Send Scroll</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// 6. PRIVACY VIEW
function renderPrivacy() {
  appView.innerHTML = `
    <div style="max-width: 700px; margin: 0 auto;">
      <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 1rem;">Scroll of Terms (Privacy Policy)</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Last Updated: August 17, 2026</p>
      
      <div class="card" style="line-height: 1.7; display: flex; flex-direction: column; gap: 1rem; padding:1.5rem;">
        <p>This personal portal (<strong>swapnillens.in</strong>) operates as a completely static content website hosted on GitHub Pages.</p>
        
        <h3 style="font-family: 'Noto Serif JP', serif;">1. Personal Data Shield</h3>
        <p>No user credentials, passwords, tracking cookie indexes, or analytics scripts are loaded or saved inside this domain.</p>
        
        <h3 style="font-family: 'Noto Serif JP', serif;">2. Secure Forms</h3>
        <p>Your scrolls submitted through the Contact view are safely processed directly by Formspree and delivered to the owner. We do not inspect or store them on intermediate web databases.</p>
        
        <h3 style="font-family: 'Noto Serif JP', serif;">3. Hosting Registry</h3>
        <p>Static packages are delivered via GitHub Pages, which logs network operations (such as IP addresses and server headers) strictly to safeguard host infrastructure.</p>
      </div>
    </div>
  `;
}

// 7. 404 VIEW
function render404() {
  appView.innerHTML = `
    <div class="card" style="max-width: 500px; margin: 4rem auto; text-align: center; padding: 3rem; border-color: var(--accent-primary);">
      <i class="fas fa-ghost fa-4.px" style="color: var(--accent-primary); margin-bottom: 1.5rem; font-size:3rem;"></i>
      <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--accent-primary);">MUGEN</h1>
      <h3 style="margin-bottom: 1rem;">Infinite Route Error (404)</h3>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">You have entered an infinite dream route. This page does not exist in the Slayer registry.</p>
      <a href="#home" class="btn btn-primary" style="justify-content: center; width: 100%;">Return to Home District</a>
    </div>
  `;
}

// Global Accordion Handler
window.toggleAccordion = function(id) {
  const element = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
  if (!element) return;
  if (element.style.display === 'none') {
    element.style.display = 'block';
    if (icon) {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    }
  } else {
    element.style.display = 'none';
    if (icon) {
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  }
};

// ----------------------------------------------------
// MULTI-COLLECTION GLOBAL SEARCH
// ----------------------------------------------------
async function performGlobalSearch(searchTerm) {
  if (!searchTerm) {
    window.location.hash = previousNonSearchHash;
    return;
  }

  if (currentActiveRoute !== 'search') {
    window.location.hash = '#search';
  }

  appView.innerHTML = `
    <div class="anime-loader">
      <div class="ripple-circle" style="border-top-color: var(--accent-primary);"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem; font-family: 'Noto Serif JP', serif;">Tracking breath forms...</p>
    </div>
  `;

  // Fetch search sources
  const projects = await fetchJSON('data/projects.json') || [];
  const agents = await fetchJSON('data/agents.json') || [];
  const anime = await fetchJSON('data/anime.json') || [];

  const query = searchTerm.toLowerCase();

  // Filter lists
  const matchProjects = projects.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.description.toLowerCase().includes(query) ||
    p.technology.some(t => t.toLowerCase().includes(query))
  );

  const matchAgents = agents.filter(a => 
    a.name.toLowerCase().includes(query) || 
    a.desc.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query)
  );

  const matchAnime = anime.filter(a => 
    a.title.toLowerCase().includes(query) || 
    a.japanese.toLowerCase().includes(query) ||
    a.synopsis.toLowerCase().includes(query)
  );

  let resultsHTML = '';
  let totalCount = matchProjects.length + matchAgents.length + matchAnime.length;

  if (totalCount === 0) {
    resultsHTML = `
      <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
        <i class="far fa-frown fa-3x" style="margin-bottom: 1rem;"></i>
        <h3>No scroll matches found</h3>
        <p style="font-size:0.9rem; margin-top:0.5rem;">Try typing keyword parameters like "Bamboo", "Frieren", "Claude", or "Python".</p>
      </div>
    `;
  } else {
    // 1. Projects matches
    if (matchProjects.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-project-diagram"></i> Matching Projects (${matchProjects.length})</h3>
        <div class="grid grid-cols-2">
          ${matchProjects.map(p => `
            <div class="card" style="padding:1.25rem;">
              <div class="card-header">
                <h4 class="card-title">${p.name}</h4>
                <span class="badge badge-success">${p.status}</span>
              </div>
              <p class="card-body" style="font-size:0.85rem; margin-bottom:1rem;">${p.description}</p>
              <div class="card-footer" style="padding:0;">
                <span></span>
                <a href="#projects" class="btn" style="font-size:0.75rem; padding:0.25rem 0.5rem;">Explore Projects</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 2. Agents matches
    if (matchAgents.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-robot"></i> Matching AI Agents (${matchAgents.length})</h3>
        <div class="grid grid-cols-2">
          ${matchAgents.map(a => `
            <div class="card" style="padding:1.25rem;">
              <div class="card-header">
                <h4 class="card-title">${a.name}</h4>
                <span class="badge badge-secondary">${a.category}</span>
              </div>
              <p class="card-body" style="font-size:0.85rem; margin-bottom:1rem;">${a.desc}</p>
              <div class="card-footer" style="padding:0;">
                <span></span>
                <a href="#agents" class="btn" style="font-size:0.75rem; padding:0.25rem 0.5rem;">Go to Agents</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. Anime matches
    if (matchAnime.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-tv"></i> Matching Anime (${matchAnime.length})</h3>
        <div class="grid grid-cols-2">
          ${matchAnime.map(a => `
            <div class="card" style="padding:1.25rem;">
              <div class="card-header">
                <div>
                  <h4 class="card-title">${a.title}</h4>
                  <span style="font-size:0.75rem; color:var(--text-muted);">${a.japanese}</span>
                </div>
                <span class="badge badge-warning">★ ${a.score}</span>
              </div>
              <p class="card-body" style="font-size:0.85rem; margin-bottom:1rem;">${a.synopsis}</p>
              <div class="card-footer" style="padding:0;">
                <span></span>
                <a href="#anime" class="btn" style="font-size:0.75rem; padding:0.25rem 0.5rem;">Go to Anime</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  appView.innerHTML = `
    <h1 style="font-family: 'Noto Serif JP', serif; font-size: 2.25rem; margin-bottom: 0.5rem;">Scroll Search Results</h1>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Found ${totalCount} results matching your tracking parameter "<strong>${searchTerm}</strong>".</p>
    <a href="${previousNonSearchHash}" class="btn" style="margin-bottom: 1rem;"><i class="fas fa-times"></i> Clear Search</a>
    
    <div>
      ${resultsHTML}
    </div>
  `;
}

// Register Search rendering route
routes['search'] = async () => {
  const query = document.getElementById('global-search').value;
  await performGlobalSearch(query);
};

// ----------------------------------------------------
// SCROLL AND MOBILE INTERACTION LOGIC
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Hash Routing listeners
  window.addEventListener('hashchange', handleRouting);
  // Initial page load routing trigger
  handleRouting();

  // Mobile overlay more menu toggling
  const moreBtn = document.getElementById('bottom-nav-more');
  const closeBtn = document.getElementById('overlay-close-btn');
  const overlay = document.getElementById('mobile-more-overlay');
  
  if (moreBtn && closeBtn && overlay) {
    moreBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
    });
    
    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    
    // Close overlay when clicking any link inside it
    overlay.querySelectorAll('.overlay-link').forEach(link => {
      link.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    });
  }

  // Search input keystroke listener
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    let searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        const term = e.target.value.trim();
        if (term) {
          performGlobalSearch(term);
        } else {
          // Clear search and restore previous view
          window.location.hash = previousNonSearchHash;
        }
      }, 300);
    });

    // Global keyboard shortcut: slash (/) focuses search bar
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Back to Top button logic
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
