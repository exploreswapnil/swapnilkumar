// Data Cache to prevent double requests
const dataCache = {};

async function fetchJSON(url) {
  if (dataCache[url]) return dataCache[url];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.statusText}`);
    const data = await response.json();
    dataCache[url] = data;
    return data;
  } catch (error) {
    console.error('Error fetching JSON data:', error);
    return null;
  }
}

async function fetchText(url) {
  if (dataCache[url]) return dataCache[url];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load text ${url}`);
    const text = await response.text();
    dataCache[url] = text;
    return text;
  } catch (error) {
    console.error('Error fetching text data:', error);
    return '';
  }
}

// Router configuration
const appView = document.getElementById('app-view');
let currentActiveRoute = '';
let previousNonSearchHash = '#home';

// Map hash routes to view render functions
const routes = {
  'home': renderHome,
  'about': renderAbout,
  'resume': renderResume,
  'projects': renderProjects,
  'ai-lab': renderAiLab,
  'articles': renderArticles,
  'ideas': renderIdeas,
  'learning': renderLearning,
  'speaking': renderSpeaking,
  'resources': renderResources,
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
  // Hide reading progress bar by default
  document.querySelector('.reading-progress-container').style.display = 'none';
  window.removeEventListener('scroll', updateReadingProgress);
  
  // Close mobile drawer on routing
  document.body.classList.remove('sidebar-open');
  const sidebar = document.getElementById('sidebar-drawer');
  if (sidebar) sidebar.style.transform = '';

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

  // Clear search field unless we're on a search route
  const searchInput = document.getElementById('global-search');
  if (searchInput && route !== 'search') {
    searchInput.value = '';
  }

  currentActiveRoute = route;
  appView.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 300px; gap: 1rem;">
      <i class="fas fa-circle-notch fa-spin fa-2x" style="color: var(--accent-primary);"></i>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Compiling platform dashboard view...</p>
    </div>
  `;

  try {
    await renderFn(query);
  } catch (err) {
    console.error('Routing render error:', err);
    appView.innerHTML = `
      <div class="card" style="margin: 2rem auto; max-width: 500px; text-align: center; border-color: var(--error);">
        <h3 style="color: var(--error); margin-bottom: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Rendering Error</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">An error occurred while compiling this view.</p>
        <button class="btn btn-primary" onclick="window.location.hash = '#home'">Go back Home</button>
      </div>
    `;
  }
}

// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. HOME VIEW
async function renderHome() {
  const profile = await fetchJSON('data/profile.json');
  const projects = await fetchJSON('data/projects.json');
  const articles = await fetchJSON('data/articles.json');
  const learning = await fetchJSON('data/learning.json');

  if (!profile) return;

  const statsHTML = profile.statistics ? profile.statistics.map(stat => `
    <div class="stat-card">
      <div class="stat-value">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join('') : '';

  const recentProjects = projects ? projects.slice(0, 3).map(proj => `
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">${proj.name}</h4>
        <span class="badge ${proj.status === 'Production' ? 'badge-success' : 'badge-primary'}">${proj.status}</span>
      </div>
      <p class="card-body">${proj.description}</p>
      <div class="card-footer">
        <div style="display: flex; gap: 0.25rem;">
          ${proj.technology.slice(0, 3).map(tech => `<span class="badge badge-muted">${tech}</span>`).join('')}
        </div>
        <a href="#projects" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">Explore <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
  `).join('') : '';

  const recentArticles = articles ? articles.slice(0, 2).map(art => `
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">${art.title}</h4>
        <span class="badge badge-muted">${art.readTime}</span>
      </div>
      <p class="card-body">${art.summary}</p>
      <div class="card-footer">
        <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="far fa-calendar"></i> ${art.date}</span>
        <a href="#articles?slug=${art.slug}" class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">Read <i class="fas fa-book-open"></i></a>
      </div>
    </div>
  `).join('') : '';

  const recentLearning = learning && learning.timeline ? learning.timeline.slice(0, 2).map(log => `
    <li class="timeline-item" style="padding-bottom: 1.25rem;">
      <div class="timeline-badge" style="border-color: var(--accent-secondary);"></div>
      <div class="timeline-header">
        <span class="timeline-period" style="background-color: var(--accent-secondary-light); color: var(--accent-secondary);">${log.date}</span>
        <h5 style="margin: 0; font-size: 0.95rem;">${log.event}</h5>
      </div>
      <p class="timeline-desc" style="font-size: 0.85rem; margin-top: 0.25rem;">${log.description}</p>
    </li>
  `).join('') : '';

  appView.innerHTML = `
    <div class="hero">
      <p class="hero-subtitle">System Team Platform Engineer</p>
      <h1 class="hero-title">${profile.name}</h1>
      <p class="hero-text">${profile.summary}</p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <a href="#contact" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Get in touch</a>
        <a href="#resume" class="btn"><i class="fas fa-file-invoice"></i> View Resume</a>
        <a href="${profile.socials.github}" target="_blank" class="btn" aria-label="GitHub"><i class="fab fa-github"></i> GitHub</a>
      </div>
    </div>

    <div class="stats-grid">
      ${statsHTML}
    </div>

    <div class="section-header">
      <h2 class="section-title">Latest Technical Projects</h2>
      <a href="#projects" class="btn" style="font-size: 0.8rem;">All Projects</a>
    </div>
    <div class="grid grid-cols-3">
      ${recentProjects}
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem; margin-top: 2rem;">
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Recent Articles</h2>
          <a href="#articles" class="btn" style="font-size: 0.8rem;">All Articles</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${recentArticles}
        </div>
      </div>
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Current Studies</h2>
          <a href="#learning" class="btn" style="font-size: 0.8rem;">Journal</a>
        </div>
        <ul class="timeline" style="margin-top: 1rem;">
          ${recentLearning}
        </ul>
      </div>
    </div>
  `;
}

// 2. ABOUT VIEW
async function renderAbout() {
  const profile = await fetchJSON('data/profile.json');
  const resume = await fetchJSON('data/resume.json');
  const learning = await fetchJSON('data/learning.json');

  if (!profile) return;

  const timelineHTML = learning && learning.timeline ? learning.timeline.map(item => `
    <div class="timeline-item">
      <div class="timeline-badge"></div>
      <div class="timeline-header">
        <span class="timeline-period">${item.date}</span>
        <h4 style="margin: 0; font-size: 1.1rem;">${item.event}</h4>
      </div>
      <p class="timeline-desc" style="margin-top: 0.5rem;">${item.description}</p>
    </div>
  `).join('') : '';

  appView.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">About Me</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Platform Engineering advocate and specialist architect based in ${profile.location}.</p>
      
      <div class="card" style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;"><i class="fas fa-quote-left" style="color: var(--accent-primary);"></i> Professional Philosophy</h3>
        <p style="font-style: italic; font-size: 1.1rem; line-height: 1.7; color: var(--text-primary);">${profile.philosophy}</p>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Biography</h3>
        <p style="margin-bottom: 1rem;">I serve as a ${profile.title} at ${profile.company} within the ${profile.department}. My day-to-day focus lies in modernizing release platforms, securing runtime environments, and helping engineers ship stable features faster.</p>
        <p style="margin-bottom: 1rem;">I specialize in configuring large-scale CI/CD platforms, build clustering tools, static quality checkers, and package caches. Through automation via PowerShell and Python, I target extraneous developer friction, aiming to drop setup friction and build cycle bottlenecks.</p>
        <p>Outside of enterprise environments, my passion is testing new AI workflows, researching local LLM deployments, writing documentation automation templates, and configuring a home lab clusters.</p>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Areas of Interest</h3>
        <div class="tag-container" style="margin-top: 1rem;">
          <span class="tag-pill">Platform Architecture</span>
          <span class="tag-pill">Agentic AI & LLMs</span>
          <span class="tag-pill">CI/CD Governance</span>
          <span class="tag-pill">Documentation-as-Code</span>
          <span class="tag-pill">System Automation</span>
          <span class="tag-pill">Container Security</span>
          <span class="tag-pill">Self-Hosting Labs</span>
        </div>
      </div>

      <div style="margin-bottom: 3rem;">
        <h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Roadmap & Studies</h3>
        <div class="timeline">
          ${timelineHTML}
        </div>
      </div>
    </div>
  `;
}

// 3. RESUME VIEW
async function renderResume() {
  const resume = await fetchJSON('data/resume.json');
  const profile = await fetchJSON('data/profile.json');
  if (!resume || !profile) return;

  const expHTML = resume.experience.map(exp => `
    <div class="card" style="margin-bottom: 1.5rem; border-color: var(--border-color);">
      <div class="card-header" style="margin-bottom: 0.5rem;">
        <div>
          <h4 style="margin: 0; font-size: 1.15rem; font-weight: 700;">${exp.role}</h4>
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--accent-primary);">${exp.company}</span>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-primary">${exp.period}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;"><i class="fas fa-map-marker-alt"></i> ${exp.location}</div>
        </div>
      </div>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">${exp.description}</p>
      <ul class="timeline-bullets">
        ${exp.bullet_points.map(pt => `<li>${pt}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const skillsHTML = resume.skills.map(cat => `
    <div class="card">
      <h4 style="margin-bottom: 1rem; font-size: 1.05rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; color: var(--accent-primary);"><i class="fas fa-check-double"></i> ${cat.category}</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
        ${cat.items.map(skill => `<span class="badge badge-muted">${skill}</span>`).join('')}
      </div>
    </div>
  `).join('');

  const certHTML = resume.certifications.map(cert => `
    <li style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; font-size: 0.9rem;">
      <span style="font-weight: 600; color: var(--text-primary);">${cert.name} <span style="font-weight: 400; color: var(--text-muted);">| ${cert.issuer}</span></span>
      <span style="color: var(--accent-primary); font-weight: 500;">${cert.date}</span>
    </li>
  `).join('');

  appView.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto;">
      <div class="resume-actions">
        <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> Save PDF / Print CV</button>
      </div>

      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-lg); background-color: var(--bg-secondary); padding: 3rem; box-shadow: var(--shadow-md);">
        
        <!-- Resume Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--accent-primary); padding-bottom: 2rem; margin-bottom: 2rem;">
          <div>
            <h1 style="font-size: 2.5rem; letter-spacing: -0.5px; margin-bottom: 0.25rem;">${profile.name}</h1>
            <p style="font-size: 1.2rem; color: var(--accent-primary); font-weight: 600;">${profile.title}</p>
          </div>
          <div style="text-align: right; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.25rem; justify-content: flex-end;">
            <span><i class="fas fa-envelope"></i> ${profile.socials.email}</span>
            <span><i class="fab fa-linkedin"></i> <a href="${profile.socials.linkedin}" target="_blank">linkedin.com/in/swapnilkr</a></span>
            <span><i class="fas fa-map-marker-alt"></i> ${profile.location}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 3rem;">
          <!-- Left Column -->
          <div>
            <h3 style="margin-bottom: 1.25rem; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);"><i class="fas fa-briefcase"></i> Professional Experience</h3>
            ${expHTML}
          </div>

          <!-- Right Column -->
          <div>
            <h3 style="margin-bottom: 1.25rem; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);"><i class="fas fa-tools"></i> Core Skills</h3>
            <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2.5rem;">
              ${skillsHTML}
            </div>

            <h3 style="margin-bottom: 1rem; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);"><i class="fas fa-graduation-cap"></i> Education</h3>
            <div class="card" style="margin-bottom: 2.5rem;">
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem;">${resume.education[0].degree}</h4>
              <p style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 600; margin-bottom: 0.25rem;">${resume.education[0].institution}</p>
              <span class="badge badge-muted" style="align-self: flex-start;">${resume.education[0].period}</span>
            </div>

            <h3 style="margin-bottom: 1rem; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);"><i class="fas fa-certificate"></i> Certifications</h3>
            <div class="card">
              <ul style="list-style: none;">
                ${certHTML}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// 4. PROJECTS VIEW
async function renderProjects(query) {
  const projects = await fetchJSON('data/projects.json');
  if (!projects) return;

  const activeFilter = query.filter || 'All';
  const filters = ['All', 'Production', 'Active', 'Beta'];

  const filterButtonsHTML = filters.map(f => `
    <a href="#projects?filter=${f}" class="btn ${activeFilter === f ? 'btn-primary' : ''}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
      ${f}
    </a>
  `).join('');

  const filteredProjects = projects.filter(p => activeFilter === 'All' || p.status === activeFilter);

  const projectsHTML = filteredProjects.map((p, index) => `
    <div class="card" style="border-color: var(--border-color);">
      <div class="card-header">
        <div>
          <h3 class="card-title">${p.name}</h3>
          <span class="badge ${p.status === 'Production' ? 'badge-success' : 'badge-primary'}" style="margin-top: 0.25rem;">${p.status}</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a href="${p.repo}" target="_blank" class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fab fa-github"></i> Code</a>
          <a href="${p.docs}" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fas fa-info-circle"></i> Info</a>
        </div>
      </div>
      
      <p class="card-body" style="font-size: 0.9rem; margin-bottom: 1rem;">${p.description}</p>
      
      <!-- Collapsible Architecture and Lessons Learned Accordion -->
      <div style="margin-bottom: 1.25rem; font-size: 0.85rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
        <button class="btn" style="width: 100%; text-align: left; justify-content: space-between; border: none; padding: 0.4rem 0; font-weight: 600;" onclick="toggleAccordion('acc-arch-${index}')">
          <span><i class="fas fa-network-wired" style="color: var(--accent-secondary);"></i> System Architecture</span>
          <i class="fas fa-chevron-down" id="acc-arch-${index}-icon"></i>
        </button>
        <div id="acc-arch-${index}" style="display: none; padding-top: 0.5rem; color: var(--text-muted); line-height: 1.5;">
          ${p.architecture}
        </div>

        <button class="btn" style="width: 100%; text-align: left; justify-content: space-between; border: none; padding: 0.4rem 0; margin-top: 0.25rem; font-weight: 600;" onclick="toggleAccordion('acc-les-${index}')">
          <span><i class="fas fa-graduation-cap" style="color: var(--warning);"></i> Lessons Learned</span>
          <i class="fas fa-chevron-down" id="acc-les-${index}-icon"></i>
        </button>
        <div id="acc-les-${index}" style="display: none; padding-top: 0.5rem; color: var(--text-muted); line-height: 1.5; font-style: italic;">
          ${p.lessons}
        </div>
      </div>

      <div class="card-footer" style="padding-top: 0; margin-top: 0;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
          ${p.technology.map(tech => `<span class="badge badge-muted">${tech}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Technical Projects</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">A breakdown of operational scripts, dashboards, and automated infrastructure frameworks.</p>
    
    <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
      ${filterButtonsHTML}
    </div>

    <div class="grid grid-cols-2">
      ${projectsHTML.length > 0 ? projectsHTML : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No projects found for this filter.</p>'}
    </div>
  `;
}

// Global Accordion Handler
window.toggleAccordion = function(id) {
  const element = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
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

// 5. AI LAB VIEW
async function renderAiLab() {
  const aiLab = await fetchJSON('data/ai_lab.json');
  if (!aiLab) return;

  const promptsHTML = aiLab.prompts.map(pr => `
    <div class="card" style="border-color: var(--border-color);">
      <div class="card-header">
        <h4 class="card-title">${pr.title}</h4>
        <span class="badge badge-primary">${pr.category}</span>
      </div>
      <p class="card-body" style="font-size: 0.875rem; margin-bottom: 1rem;">${pr.description}</p>
      
      <div style="margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="btn btn-primary" onclick="copyPromptToClipboard('${pr.id}')" id="btn-copy-${pr.id}">
          <i class="far fa-copy"></i> Copy Prompt Template
        </button>
        <button class="btn" onclick="toggleAccordion('view-prompt-${pr.id}')" style="justify-content: center;">
          View Template Structure
        </button>
        <div id="view-prompt-${pr.id}" style="display: none; margin-top: 0.5rem;">
          <pre style="background-color: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; white-space: pre-wrap; font-family: monospace; color: var(--text-secondary); max-height: 150px; overflow-y: auto; text-align: left;">${pr.template}</pre>
        </div>
        <textarea id="val-${pr.id}" style="display:none;">${pr.template}</textarea>
      </div>
    </div>
  `).join('');

  const llmRows = aiLab.llms.map(llm => `
    <tr>
      <td style="font-weight: 600; color: var(--text-primary);">${llm.name}</td>
      <td style="font-size: 0.85rem;">${llm.developer}</td>
      <td>${llm.context}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${llm.cost_in}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${llm.cost_out}</td>
      <td style="font-size: 0.85rem; color: var(--text-muted);">${llm.specialty}</td>
      <td><span class="badge badge-success">${llm.score} / 10</span></td>
    </tr>
  `).join('');

  const simOptions = aiLab.simulations.map(sim => `
    <option value="${sim.id}">${sim.title} (${sim.difficulty})</option>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">AI Engineering Lab</h1>
    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Experimentation bench with custom workflow agents, prompt templates, and evaluation matrices.</p>

    <!-- Interactive Agent Simulator -->
    <div class="card" style="margin-bottom: 3rem; border-color: var(--accent-primary); box-shadow: var(--shadow-lg);">
      <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h3 class="card-title" style="color: var(--accent-primary);"><i class="fas fa-robot"></i> Interactive Agent Simulator</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Select a script compilation task and run the automated execution pipeline.</p>
        </div>
      </div>
      
      <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1;">
          <label class="form-label" for="sim-select">Select Target Workflow</label>
          <select class="form-control" id="sim-select" style="background-color: var(--bg-tertiary);">
            ${simOptions}
          </select>
        </div>
        <div style="padding-top: 1.5rem;">
          <button class="btn btn-primary" onclick="runAgentSimulation()"><i class="fas fa-play"></i> Launch Agent</button>
        </div>
      </div>

      <div class="sim-console" id="simulation-console">
        <div class="console-line"><span class="console-time">[00:00:00]</span> <span class="console-prefix">SYSTEM:</span> Agent interface initialized. Ready to execute workflow.</div>
      </div>
    </div>

    <!-- Prompts Library -->
    <div class="section-header" style="margin-top: 0;">
      <h2 class="section-title">Prompt Engineering Templates</h2>
    </div>
    <div class="grid grid-cols-3" style="margin-bottom: 3.5rem;">
      ${promptsHTML}
    </div>

    <!-- LLM Matrix -->
    <div class="section-header" style="margin-top: 0;">
      <h2 class="section-title">LLM Assessment Matrix</h2>
    </div>
    <div class="card" style="padding: 0; overflow-x: auto;">
      <table class="responsive-table">
        <thead>
          <tr>
            <th>Model Name</th>
            <th>Developer</th>
            <th>Context Window</th>
            <th>Input Cost</th>
            <th>Output Cost</th>
            <th>Target Speciality</th>
            <th>Evaluation</th>
          </tr>
        </thead>
        <tbody>
          ${llmRows}
        </tbody>
      </table>
    </div>
  `;
}

// Prompt Copy Helper
window.copyPromptToClipboard = function(id) {
  const textVal = document.getElementById('val-' + id).value;
  navigator.clipboard.writeText(textVal).then(() => {
    const btn = document.getElementById('btn-copy-' + id);
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check" style="color: var(--success);"></i> Copied!`;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');
      setTimeout(() => {
        btn.innerHTML = `<i class="far fa-copy"></i> Copy Prompt Template`;
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-success');
      }, 2000);
    }
  });
};

// Agent Simulator State
let simTimer = null;
window.runAgentSimulation = async function() {
  if (simTimer) clearTimeout(simTimer);
  
  const aiLab = await fetchJSON('data/ai_lab.json');
  const simId = document.getElementById('sim-select').value;
  const sim = aiLab.simulations.find(s => s.id === simId);
  const consoleEl = document.getElementById('simulation-console');
  
  if (!sim || !consoleEl) return;

  consoleEl.innerHTML = `
    <div class="console-line"><span class="console-time">[${new Date().toLocaleTimeString()}]</span> <span class="console-prefix">SYSTEM:</span> Bootstrapping agent workspace for "${sim.title}"...</div>
  `;

  let currentStep = 0;
  
  function executeNextStep() {
    if (currentStep >= sim.steps.length) {
      consoleEl.innerHTML += `
        <div class="console-line" style="color:#10b981;"><span class="console-time">[${new Date().toLocaleTimeString()}]</span> <span class="console-prefix">SYSTEM:</span> WORKFLOW RESOLVED SUCCESSFULLY. Clean workspace exit.</div>
      `;
      consoleEl.scrollTop = consoleEl.scrollHeight;
      return;
    }

    const step = sim.steps[currentStep];
    const timestamp = new Date().toLocaleTimeString();
    
    let colorClass = '';
    if (step.status === 'error') colorClass = 'console-error';
    if (step.status === 'warning') colorClass = 'console-warning';

    consoleEl.innerHTML += `
      <div class="console-line ${colorClass}">
        <span class="console-time">[${timestamp}]</span> 
        <span class="console-prefix">${step.agent.toUpperCase()}:</span> 
        <strong>${step.action}</strong> - ${step.details}
      </div>
    `;
    
    consoleEl.scrollTop = consoleEl.scrollHeight;
    currentStep++;
    
    simTimer = setTimeout(executeNextStep, 1500);
  }

  simTimer = setTimeout(executeNextStep, 1000);
};

// 6. ARTICLES VIEW
async function renderArticles(query) {
  const articles = await fetchJSON('data/articles.json');
  if (!articles) return;

  // Single Article Reader View
  if (query.slug) {
    const art = articles.find(a => a.slug === query.slug);
    if (!art) {
      render404();
      return;
    }

    // Display progress bar and register scroll monitor
    document.querySelector('.reading-progress-container').style.display = 'block';
    window.addEventListener('scroll', updateReadingProgress);

    const mdContent = await fetchText(art.file);
    let parsedHTML = '';
    if (window.marked && window.marked.parse) {
      parsedHTML = window.marked.parse(mdContent);
    } else {
      parsedHTML = `<p>${art.summary}</p><p>Error loading parser engine.</p>`;
    }

    appView.innerHTML = `
      <div class="article-container">
        <a href="#articles" class="btn" style="margin-bottom: 2rem;"><i class="fas fa-arrow-left"></i> Back to Articles</a>
        
        <article class="article-header">
          <div class="article-meta">
            <span><i class="far fa-calendar"></i> ${art.date}</span>
            <span><i class="far fa-folder"></i> ${art.category}</span>
            <span><i class="far fa-clock"></i> ${art.readTime}</span>
          </div>
          <h1 style="font-size: 2.5rem; margin-bottom: 1.5rem;">${art.title}</h1>
        </article>

        <div class="article-content">
          ${parsedHTML}
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 3rem 0;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Thank you for reading!</p>
            <p style="font-weight: 600; color: var(--text-primary);">Swapnil Kumar</p>
          </div>
          ${art.mediumUrl ? `<a href="${art.mediumUrl}" target="_blank" class="btn btn-primary"><i class="fab fa-medium"></i> Read on Medium</a>` : ''}
        </div>
      </div>
    `;

    // Highlight code blocks
    if (window.hljs) {
      window.hljs.highlightAll();
    }
    return;
  }

  // Articles List View
  const activeCategory = query.category || 'All';
  const categories = ['All', 'Platform Engineering', 'DevOps', 'Personal'];
  const filterBtns = categories.map(cat => `
    <a href="#articles?category=${cat}" class="btn ${activeCategory === cat ? 'btn-primary' : ''}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
      ${cat}
    </a>
  `).join('');

  const filteredArticles = articles.filter(a => activeCategory === 'All' || a.category === activeCategory);

  const listHTML = filteredArticles.map(art => `
    <div class="card" style="border-color: var(--border-color);">
      <div class="card-header" style="margin-bottom: 0.5rem;">
        <div>
          <h3 class="card-title" style="font-size: 1.25rem;">${art.title}</h3>
          <div style="display:flex; gap:0.5rem; margin-top: 0.25rem;">
            <span class="badge badge-primary">${art.category}</span>
            <span class="badge badge-muted">${art.readTime}</span>
          </div>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="far fa-calendar"></i> ${art.date}</span>
      </div>
      <p class="card-body" style="font-size: 0.925rem;">${art.summary}</p>
      <div class="card-footer">
        ${art.mediumUrl ? `<a href="${art.mediumUrl}" target="_blank" style="font-size:0.85rem;"><i class="fab fa-medium"></i> View on Medium</a>` : '<span></span>'}
        <a href="#articles?slug=${art.slug}" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Read Article <i class="fas fa-book-open"></i></a>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Technical Blog & Articles</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">Writings on platform architecture, automation, Docker networks, and learning workflows.</p>
    
    <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap;">
      ${filterBtns}
    </div>

    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      ${listHTML.length > 0 ? listHTML : '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No articles found for this category.</p>'}
    </div>
  `;
}

// Reading progress bar monitor
function updateReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = scrollPercent + '%';
}

// 7. IDEAS LOG VIEW
async function renderIdeas() {
  const ideas = await fetchJSON('data/ideas.json');
  if (!ideas) return;

  const listHTML = ideas.map(idea => `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${idea.title}</h3>
        <span class="badge badge-primary">${idea.category}</span>
      </div>
      <p class="card-body" style="font-size: 0.9rem;">${idea.description}</p>
      <div class="card-footer">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Status: <span style="color: var(--accent-primary);">${idea.status}</span></span>
        <span class="badge badge-success" style="font-size: 0.75rem;"><i class="fas fa-bolt"></i> ${idea.impact}</span>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Engineering Ideas Log</h1>
    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Backlog of startup briefs, architecture models, CLI script plans, and productivity drafts.</p>
    
    <div class="grid grid-cols-2">
      ${listHTML}
    </div>
  `;
}

// 8. LEARNING JOURNAL VIEW
async function renderLearning() {
  const learning = await fetchJSON('data/learning.json');
  if (!learning) return;

  const timelineHTML = learning.timeline.map(t => `
    <div class="timeline-item">
      <div class="timeline-badge" style="border-color: var(--accent-primary);"></div>
      <div class="timeline-header">
        <span class="timeline-period">${t.date}</span>
        <h4 style="margin: 0; font-size: 1.1rem;">${t.event}</h4>
      </div>
      <p class="timeline-desc" style="margin-top: 0.5rem; font-size: 0.9rem;">${t.description}</p>
    </div>
  `).join('');

  const booksHTML = learning.books.map(b => `
    <div class="card">
      <div class="card-header" style="margin-bottom: 0.5rem;">
        <h4 style="margin: 0; font-size: 1.05rem;">${b.title}</h4>
        <span class="badge ${b.status === 'Completed' ? 'badge-success' : 'badge-primary'}">${b.status}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">by ${b.author}</p>
      <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; font-style: italic;">"${b.takeaway}"</p>
      <div style="margin-top: 1rem; font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">
        Rating: ${b.rating}
      </div>
    </div>
  `).join('');

  const coursesHTML = learning.courses.map(c => `
    <li style="margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
      <div>
        <h4 style="font-size: 0.95rem; margin: 0;">${c.title}</h4>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${c.issuer}</span>
      </div>
      <span class="badge badge-success"><i class="fas fa-check-circle"></i> ${c.status}</span>
    </li>
  `).join('');

  const notesHTML = learning.daily_notes.map(n => `
    <div class="card" style="border-left: 4px solid var(--accent-primary);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
        <span>Topic: <strong>${n.topic}</strong></span>
        <span><i class="far fa-calendar-alt"></i> ${n.date}</span>
      </div>
      <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); white-space: pre-line;">${n.notes}</p>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Learning Journal</h1>
    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Documenting books read, training courses completed, and daily architecture scratch notes.</p>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem;">
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Daily Tech Notes</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${notesHTML}
        </div>

        <div class="section-header">
          <h2 class="section-title">Curriculum Journey</h2>
        </div>
        <div class="timeline" style="margin-top: 1rem;">
          ${timelineHTML}
        </div>
      </div>
      
      <div>
        <div class="section-header" style="margin-top: 0;">
          <h2 class="section-title">Reading List</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${booksHTML}
        </div>

        <div class="section-header">
          <h2 class="section-title">Certifications</h2>
        </div>
        <ul style="list-style: none; margin-top: 1rem;">
          ${coursesHTML}
        </ul>
      </div>
    </div>
  `;
}

// 9. SPEAKING VIEW
async function renderSpeaking() {
  const speaking = await fetchJSON('data/speaking.json');
  if (!speaking) return;

  const talksHTML = speaking.map(talk => `
    <div class="card" style="border-color: var(--border-color);">
      <div class="card-header" style="margin-bottom: 0.5rem;">
        <div>
          <h3 class="card-title" style="font-size: 1.25rem;">${talk.title}</h3>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-primary);"><i class="fas fa-calendar-day"></i> ${talk.event} - ${talk.date}</span>
        </div>
      </div>
      <p class="card-body" style="font-size: 0.9rem; margin-bottom: 1.25rem;">${talk.description}</p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 1rem;">
        ${talk.topics.map(t => `<span class="badge badge-muted">${t}</span>`).join('')}
      </div>

      <div class="card-footer" style="padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
        <span></span>
        <div style="display: flex; gap: 0.5rem;">
          <a href="${talk.slides}" target="_blank" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="far fa-file-powerpoint"></i> View Slides</a>
          ${talk.video ? `<a href="${talk.video}" target="_blank" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="fab fa-youtube"></i> Watch Video</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Speaking & Presentations</h1>
    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Public speaking sessions, architecture talks, and interactive presentation slide deck summaries.</p>
    
    <div class="grid grid-cols-2">
      ${talksHTML}
    </div>
  `;
}

// 10. RESOURCES VIEW
async function renderResources() {
  const resources = await fetchJSON('data/resources.json');
  if (!resources) return;

  const catsHTML = resources.map(cat => `
    <div style="margin-bottom: 2.5rem;">
      <h3 style="font-size: 1.3rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; color: var(--accent-primary);">
        ${cat.category}
      </h3>
      <div class="grid grid-cols-2">
        ${cat.items.map(item => `
          <div class="card">
            <div class="card-header">
              <h4 class="card-title" style="font-size: 1.05rem;">${item.title}</h4>
              <span class="badge badge-primary" style="font-size: 0.7rem;">${item.type}</span>
            </div>
            <p class="card-body" style="font-size: 0.85rem; margin-bottom: 1.25rem;">${item.description}</p>
            <div class="card-footer" style="margin-top: auto;">
              <span></span>
              <a href="${item.link}" target="_blank" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                Get Template <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Engineering Resources</h1>
    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">A collection of bootstrap files, PowerShell scripts, and pipeline orchestration templates.</p>
    
    <div>
      ${catsHTML}
    </div>
  `;
}

// 11. CONTACT VIEW
async function renderContact() {
  const profile = await fetchJSON('data/profile.json');
  if (!profile) return;

  appView.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Lets Connect</h1>
      <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Have an interesting project, automation challenge, or speaking event? Drop a line below.</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2.5rem;">
        <!-- Info -->
        <div>
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.75rem;">Contact Information</h4>
            <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><i class="fas fa-envelope" style="color: var(--accent-primary); margin-right: 0.5rem;"></i> ${profile.socials.email}</p>
            <p style="font-size: 0.9rem;"><i class="fas fa-map-marker-alt" style="color: var(--accent-primary); margin-right: 0.5rem;"></i> ${profile.socials.location}</p>
          </div>

          <div class="card">
            <h4 style="margin-bottom: 0.75rem;">Social Media</h4>
            <div style="display: flex; gap: 0.75rem; font-size: 1.5rem; margin-top: 0.5rem;">
              <a href="${profile.socials.linkedin}" target="_blank" aria-label="LinkedIn" style="color: #0077b5;"><i class="fab fa-linkedin"></i></a>
              <a href="${profile.socials.github}" target="_blank" aria-label="GitHub" style="color: var(--text-primary);"><i class="fab fa-github"></i></a>
              <a href="${profile.socials.medium}" target="_blank" aria-label="Medium" style="color: #00ab6c;"><i class="fab fa-medium"></i></a>
              <a href="${profile.socials.instagram}" target="_blank" aria-label="Instagram" style="color: #e1306c;"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <!-- Formspree Form -->
        <div class="card">
          <form action="https://formspree.io/myywaaby" method="POST" id="contact-form">
            <div class="form-group">
              <label class="form-label" for="sender-name">Your Name</label>
              <input type="text" name="name" class="form-control" id="sender-name" required placeholder="John Doe">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="sender-email">Your Email Address</label>
              <input type="email" name="_replyto" class="form-control" id="sender-email" required placeholder="john@example.com">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Form responses are safely channeled via Formspree.</small>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="sender-msg">Message Description</label>
              <textarea name="message" class="form-control" id="sender-msg" required placeholder="Hi Swapnil, let's discuss..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-success" style="width: 100%; justify-content: center; font-size: 0.95rem; padding: 0.6rem 0;"><i class="fas fa-paper-plane"></i> Send Connection Message</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// 12. PRIVACY VIEW
function renderPrivacy() {
  appView.innerHTML = `
    <div style="max-width: 700px; margin: 0 auto;">
      <h1 style="font-size: 2.25rem; margin-bottom: 1rem;">Privacy Policy</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Last Updated: July 13, 2026</p>
      
      <div class="card" style="line-height: 1.7; display: flex; flex-direction: column; gap: 1rem;">
        <p>Your privacy is extremely important to us. This personal website (<strong>swapnillens.in</strong>) operates as a completely static content website hosted on GitHub Pages.</p>
        
        <h3>1. Information Collected</h3>
        <p>This website does not collect, harvest, store, or sell any personal data. There are no registration screens, tracking cookies, or custom log databases on this website.</p>
        
        <h3>2. Contact Forms</h3>
        <p>If you contact us using the connection page, the information you supply in the email and message boxes is processed directly by <strong>Formspree Inc.</strong>, a secure third-party provider, and forwarded to the site owner's mailbox. It is never cached locally.</p>
        
        <h3>3. GitHub Hosting</h3>
        <p>Because the website files are served by GitHub Pages, GitHub may log network transactions (including IP addresses and user agents) in order to maintain security and comply with regional server guidelines. You can refer to GitHub's privacy terms for detailed information.</p>
      </div>
    </div>
  `;
}

// 13. 404 VIEW
function render404() {
  appView.innerHTML = `
    <div class="card" style="max-width: 500px; margin: 4rem auto; text-align: center; padding: 3rem;">
      <i class="fas fa-ghost fa-4x" style="color: var(--text-muted); margin-bottom: 1.5rem;"></i>
      <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--accent-primary);">404</h1>
      <h3 style="margin-bottom: 1rem;">Page Not Found</h3>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">The requested dashboard link does not exist or has been moved to a new route prefix.</p>
      <a href="#home" class="btn btn-primary" style="justify-content: center; width: 100%;">Return to Home Dashboard</a>
    </div>
  `;
}

// ----------------------------------------------------
// MULTI-COLLECTION GLOBAL SEARCH
// ----------------------------------------------------
async function performGlobalSearch(searchTerm) {
  if (!searchTerm) {
    // If empty search, return to previous page
    window.location.hash = previousNonSearchHash;
    return;
  }

  // Set URL route parameter quietly to #search
  if (currentActiveRoute !== 'search') {
    window.location.hash = '#search';
  }

  appView.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 300px; gap: 1rem;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--accent-primary);"></i>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Searching database files...</p>
    </div>
  `;

  // Fetch all searchable collections
  const projects = await fetchJSON('data/projects.json') || [];
  const articles = await fetchJSON('data/articles.json') || [];
  const aiLab = await fetchJSON('data/ai_lab.json') || [];
  const resources = await fetchJSON('data/resources.json') || [];

  const query = searchTerm.toLowerCase();

  // Search logic
  const matchProjects = projects.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.description.toLowerCase().includes(query) ||
    p.technology.some(t => t.toLowerCase().includes(query))
  );

  const matchArticles = articles.filter(a => 
    a.title.toLowerCase().includes(query) || 
    a.summary.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query)
  );

  const matchPrompts = aiLab.prompts ? aiLab.prompts.filter(pr => 
    pr.title.toLowerCase().includes(query) || 
    pr.description.toLowerCase().includes(query) ||
    pr.category.toLowerCase().includes(query)
  ) : [];

  let matchResources = [];
  resources.forEach(cat => {
    const matchingItems = cat.items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
    if (matchingItems.length > 0) {
      matchResources.push({ category: cat.category, items: matchingItems });
    }
  });

  // Compile layout results
  let resultsHTML = '';
  let totalCount = matchProjects.length + matchArticles.length + matchPrompts.length + matchResources.length;

  if (totalCount === 0) {
    resultsHTML = `
      <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
        <i class="far fa-frown fa-3x" style="margin-bottom: 1rem;"></i>
        <h3>No search matches found</h3>
        <p style="font-size:0.9rem; margin-top:0.5rem;">Try searching for tags like "Powershell", "CI/CD", "Docker", or "Platform".</p>
      </div>
    `;
  } else {
    // 1. Projects matches
    if (matchProjects.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-project-diagram"></i> Matching Projects (${matchProjects.length})</h3>
        <div class="grid grid-cols-2">
          ${matchProjects.map(p => `
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">${p.name}</h4>
                <span class="badge badge-success">${p.status}</span>
              </div>
              <p class="card-body" style="font-size:0.85rem;">${p.description}</p>
              <div class="card-footer">
                <span></span>
                <a href="#projects" class="btn btn-primary" style="font-size:0.8rem; padding:0.25rem 0.5rem;">Explore</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 2. Articles matches
    if (matchArticles.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-newspaper"></i> Matching Articles (${matchArticles.length})</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          ${matchArticles.map(a => `
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">${a.title}</h4>
                <span class="badge badge-muted">${a.date}</span>
              </div>
              <p class="card-body" style="font-size:0.875rem;">${a.summary}</p>
              <div class="card-footer">
                <span></span>
                <a href="#articles?slug=${a.slug}" class="btn btn-primary" style="font-size:0.8rem; padding:0.25rem 0.5rem;">Read Now</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. Prompts matches
    if (matchPrompts.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-robot"></i> Matching Prompts (${matchPrompts.length})</h3>
        <div class="grid grid-cols-2">
          ${matchPrompts.map(pr => `
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">${pr.title}</h4>
                <span class="badge badge-primary">${pr.category}</span>
              </div>
              <p class="card-body" style="font-size:0.85rem;">${pr.description}</p>
              <div class="card-footer">
                <span></span>
                <a href="#ai-lab" class="btn btn-primary" style="font-size:0.8rem; padding:0.25rem 0.5rem;">Copy Prompt</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 4. Resources matches
    if (matchResources.length > 0) {
      resultsHTML += `
        <h3 style="margin: 2rem 0 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;"><i class="fas fa-laptop-code"></i> Matching Resources</h3>
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          ${matchResources.map(cat => `
            <div>
              <h4 style="font-size: 0.95rem; color: var(--accent-primary); margin-bottom: 0.5rem;">${cat.category}</h4>
              <div class="grid grid-cols-2">
                ${cat.items.map(item => `
                  <div class="card">
                    <h5 style="margin:0 0 0.5rem; font-size:0.95rem;">${item.title}</h5>
                    <p style="font-size:0.85rem; color:var(--text-muted); flex-grow:1;">${item.description}</p>
                    <a href="${item.link}" target="_blank" style="font-size:0.8rem; margin-top:0.75rem; color:var(--accent-primary);"><i class="fas fa-external-link-alt"></i> Access Resource</a>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  appView.innerHTML = `
    <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Search Results</h1>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Found ${totalCount} results matching your search for "<strong>${searchTerm}</strong>".</p>
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

  // Mobile navigation drawer toggle trigger
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar-drawer');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      document.body.classList.toggle('sidebar-open');
      if (document.body.classList.contains('sidebar-open')) {
        sidebar.style.transform = 'translateX(0)';
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        sidebar.style.transform = '';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });

    // Close menu when clicking outside of drawer on mobile viewports
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('sidebar-open') && !sidebar.contains(e.target) && e.target !== menuToggle) {
        document.body.classList.remove('sidebar-open');
        sidebar.style.transform = '';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  }

  // Search input keystroke listener
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    let searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        performGlobalSearch(e.target.value.trim());
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
