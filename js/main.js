// main.js
let currentPage = 'about';
const currentYear = new Date().getFullYear();

// ---- Theme management ----
function applyThemeIcons(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (!sunIcon || !moonIcon) return;
  if (theme === 'dark') {
    sunIcon.style.display = 'inline';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline';
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  applyThemeIcons(theme);
  localStorage.setItem('theme', theme);
}

window.toggleTheme = function () {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
};

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    if (saved === 'dark') document.documentElement.classList.add('dark');
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) document.documentElement.classList.add('dark');
}

// ---- Utility ----
async function loadComponent(id, path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
  } catch (err) {
    console.error(err);
    document.getElementById(id).innerHTML = '<p>Content could not be loaded.</p>';
  }
}

async function loadPage(pageName) {
  await loadComponent('content', `components/${pageName}.html`);
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageName);
  });
  window.location.hash = pageName;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  await loadComponent('header', 'components/header.html');
  await loadComponent('footer', 'components/footer.html');

  // Sync icons now that header is in the DOM
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyThemeIcons(currentTheme);

  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = currentYear;

  const hash = window.location.hash.replace('#', '');
  if (hash && (hash === 'about' || hash === 'projects')) {
    currentPage = hash;
  }
  loadPage(currentPage);
});

// Listen for hash changes (browser back/forward)
window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'about';
  if (page !== currentPage) {
    currentPage = page;
    loadPage(page);
  }
});

// Navigation clicks
document.addEventListener('click', e => {
  if (e.target.matches('[data-page]')) {
    e.preventDefault();
    const page = e.target.getAttribute('data-page');
    if (page !== currentPage) {
      currentPage = page;
      loadPage(page);
    }
  }
});

// ---- Root background ----
(function() {
  const canvas = document.getElementById('root-bg');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); init(); loop(); });

  function strokeColor(depth) {
    const dark = document.documentElement.classList.contains('dark');
    return depth < 3
      ? (dark ? 'rgba(180,160,130,0.22)' : 'rgba(140,90,50,0.14)')
      : (dark ? 'rgba(160,140,120,0.15)' : 'rgba(120,80,40,0.09)');
  }

  function Branch(x, y, angle, len, width, depth) {
    this.x = x; this.y = y; this.angle = angle;
    this.len = len; this.width = width; this.depth = depth;
    this.progress = 0; this.speed = 0.006 + Math.random() * 0.005;
    this.done = false; this.spawned = false; this.children = [];
    this.wobble = (Math.random() - 0.5) * 0.018;
  }
  Branch.prototype.endX = function() { return this.x + Math.cos(this.angle) * this.len * this.progress; };
  Branch.prototype.endY = function() { return this.y + Math.sin(this.angle) * this.len * this.progress; };

  let branches = [];

  function spawnChildren(b) {
    if (b.depth >= 8) return;
    const count = b.depth < 2 ? 3 : 2;
    const spread = 0.55 + Math.random() * 0.3;
    for (let i = 0; i < count; i++) {
      const sign = i === 0 ? -1 : i === 1 ? 1 : (Math.random() > 0.5 ? -1 : 1) * 0.4;
      const child = new Branch(
        b.endX(), b.endY(),
        b.angle + sign * spread * (0.6 + Math.random() * 0.5) + b.wobble * 10,
        b.len * (0.60 + Math.random() * 0.18),
        b.width * 0.62,
        b.depth + 1
      );
      branches.push(child);
      b.children.push(child);
    }
  }

  function init() {
    branches = [];
    const W = canvas.width, H = canvas.height;
    [
      { x: W * 0.15, angle: -Math.PI / 2 - 0.2,  len: H * 0.18, w: 3.5 },
      { x: W * 0.42, angle: -Math.PI / 2 - 0.05, len: H * 0.20, w: 4.0 },
      { x: W * 0.70, angle: -Math.PI / 2 + 0.1,  len: H * 0.17, w: 3.2 },
      { x: W * 0.90, angle: -Math.PI / 2 + 0.25, len: H * 0.14, w: 2.8 },
    ].forEach(r => {
      const b = new Branch(r.x, H + 10, r.angle, r.len, r.w, 0);
      b.speed = 0.004 + Math.random() * 0.003;
      branches.push(b);
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of branches) {
      if (b.progress <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.endX(), b.endY());
      ctx.strokeStyle = strokeColor(b.depth);
      ctx.lineWidth = Math.max(0.3, b.width * b.progress);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function loop() {
    let allDone = true;
    for (const b of branches) {
      if (b.done) continue;
      allDone = false;
      b.progress = Math.min(1, b.progress + b.speed);
      if (b.progress >= 0.85 && !b.spawned) { b.spawned = true; spawnChildren(b); }
      if (b.progress >= 1) b.done = true;
    }
    draw();
    if (!allDone) requestAnimationFrame(loop);
  }

  init();
  loop();
})();