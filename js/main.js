// main.js
let currentPage = 'about';
const currentYear = new Date().getFullYear();

// ---- Theme management ----
function applyThemeIcons(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (!sunIcon || !moonIcon) return; // icons not in DOM yet, skip
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

window.toggleTheme = function() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
};

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    // Only set the class — icons aren't in the DOM yet
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
    return;
  }
  // Use system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  }
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
  // Update active navigation link
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageName);
  });
  // Update hash
  window.location.hash = pageName;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  initTheme(); // sets class only, no icon access

  // Load header and footer
  await loadComponent('header', 'components/header.html');
  await loadComponent('footer', 'components/footer.html');

  // Now that icons are in the DOM, sync them with the current theme
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyThemeIcons(currentTheme);

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