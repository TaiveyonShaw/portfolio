// main.js
let currentPage = 'about';
const currentYear = new Date().getFullYear();

// ---- Theme management ----
function applyTheme(theme) {
  const html = document.documentElement;
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  if (theme === 'dark') {
    html.classList.add('dark');
    sunIcon.style.display = 'inline';
    moonIcon.style.display = 'none';
  } else {
    html.classList.remove('dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline';
  }
  localStorage.setItem('theme', theme);
}

window.toggleTheme = function() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
};

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyTheme(saved);
    return;
  }
  // Use system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

// ---- Utility ----
async function loadComponent(id, path) {
  try {
    const res = await fetch(path); // No cache busting in production
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
  // Update active navigation link
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageName);
  });
  // Update hash
  window.location.hash = pageName;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  // Load header and footer
  await loadComponent('header', 'components/header.html');
  await loadComponent('footer', 'components/footer.html');

  // Set year in footer
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = currentYear;

  // Determine initial page from hash
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
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-page]')) {
    e.preventDefault();
    const page = e.target.getAttribute('data-page');
    if (page !== currentPage) {
      currentPage = page;
      loadPage(page);
    }
  }
});