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

// ---- Double Pendulum Background ----
(function () {
  const canvas = document.getElementById('pendulum-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Physics constants
  const G = 9.81;
  const L1 = 1.2, L2 = 1.0;
  const M1 = 1.0, M2 = 0.8;
  const SCALE = 120;
  const DT = 0.016;
  const MAX_TRAIL = 350;
  const SUBSTEPS = 3;

  // Four pendulums with nearly identical starting angles — chaos makes them diverge
  const CONFIGS = [
    { th1: Math.PI * 0.72,   th2: Math.PI * 0.42,  hsl: [180, 55, 55],  alpha: 0.18 },
    { th1: Math.PI * 0.721,  th2: Math.PI * 0.42,  hsl: [30,  80, 55],  alpha: 0.15 },
    { th1: Math.PI * 0.719,  th2: Math.PI * 0.42,  hsl: [320, 55, 65],  alpha: 0.13 },
    { th1: Math.PI * 0.7205, th2: Math.PI * 0.421, hsl: [210, 60, 60],  alpha: 0.12 },
  ];

  let states = CONFIGS.map(c => ({ th1: c.th1, th2: c.th2, w1: 0, w2: 0 }));
  let trails = CONFIGS.map(() => []);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Clear trails on resize so they don't look displaced
    trails = CONFIGS.map(() => []);
  }
  resize();
  window.addEventListener('resize', resize);

  // Runge-Kutta 4 derivatives for double pendulum equations of motion
  function deriv(th1, th2, w1, w2) {
    const d = 2 * M1 + M2 - M2 * Math.cos(2 * th1 - 2 * th2);
    const dw1 = (
      -G * (2 * M1 + M2) * Math.sin(th1)
      - M2 * G * Math.sin(th1 - 2 * th2)
      - 2 * Math.sin(th1 - th2) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(th1 - th2))
    ) / (L1 * d);
    const dw2 = (
      2 * Math.sin(th1 - th2) * (
        w1 * w1 * L1 * (M1 + M2)
        + G * (M1 + M2) * Math.cos(th1)
        + w2 * w2 * L2 * M2 * Math.cos(th1 - th2)
      )
    ) / (L2 * d);
    return { dw1, dw2 };
  }

  function rk4(s) {
    const { th1, th2, w1, w2 } = s;
    const k1 = deriv(th1, th2, w1, w2);
    const k2 = deriv(th1 + 0.5 * DT * w1, th2 + 0.5 * DT * w2, w1 + 0.5 * DT * k1.dw1, w2 + 0.5 * DT * k1.dw2);
    const k3 = deriv(th1 + 0.5 * DT * w1, th2 + 0.5 * DT * w2, w1 + 0.5 * DT * k2.dw1, w2 + 0.5 * DT * k2.dw2);
    const k4 = deriv(th1 + DT * w1, th2 + DT * w2, w1 + DT * k3.dw1, w2 + DT * k3.dw2);
    return {
      th1: th1 + DT * w1,
      th2: th2 + DT * w2,
      w1: w1 + (DT / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1),
      w2: w2 + (DT / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2),
    };
  }

  function getPos(s) {
    const ox = canvas.width * 0.5;
    const oy = canvas.height * 0.30;
    const x1 = ox + SCALE * L1 * Math.sin(s.th1);
    const y1 = oy + SCALE * L1 * Math.cos(s.th1);
    const x2 = x1 + SCALE * L2 * Math.sin(s.th2);
    const y2 = y1 + SCALE * L2 * Math.cos(s.th2);
    return { ox, oy, x1, y1, x2, y2 };
  }

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dark = isDark();

    // Draw trails
    for (let i = 0; i < states.length; i++) {
      const trail = trails[i];
      const cfg = CONFIGS[i];
      const [h, s, l] = cfg.hsl;
      if (trail.length < 2) continue;

      for (let j = 1; j < trail.length; j++) {
        const t = j / trail.length;
        const a = t * cfg.alpha * (dark ? 1.8 : 1.0);
        ctx.beginPath();
        ctx.moveTo(trail[j - 1].x, trail[j - 1].y);
        ctx.lineTo(trail[j].x, trail[j].y);
        ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${a})`;
        ctx.lineWidth = 0.6 + t * 1.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // Draw rods and bobs for first pendulum only (keeps it subtle)
    const s0 = states[0];
    const { ox, oy, x1, y1, x2, y2 } = getPos(s0);
    const rodColor = dark ? 'rgba(210,190,160,0.20)' : 'rgba(100,65,30,0.15)';
    const bobColor = dark ? 'rgba(210,190,160,0.30)' : 'rgba(100,65,30,0.22)';

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = rodColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    [{ x: ox, y: oy, r: 3 }, { x: x1, y: y1, r: 5 }, { x: x2, y: y2, r: 4 }].forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = bobColor;
      ctx.fill();
    });
  }

  function loop() {
    for (let i = 0; i < states.length; i++) {
      for (let sub = 0; sub < SUBSTEPS; sub++) {
        states[i] = rk4(states[i]);
      }
      const pos = getPos(states[i]);
      trails[i].push({ x: pos.x2, y: pos.y2 });
      if (trails[i].length > MAX_TRAIL) trails[i].shift();
    }
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();