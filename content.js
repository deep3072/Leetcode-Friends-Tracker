// Content script that injects the Friend button and dashboard into LeetCode pages

function createTrackerButton() {
  const button = document.createElement('button');
  button.id = 'leetcode-friend-tracker-btn';
  button.classList.add('leetcode-friend-tracker-btn');
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
    <span>Friends</span>
  `;
  button.addEventListener('click', toggleDashboard);
  return button;
}

function createDashboard() {
  const dashboard = document.createElement('div');
  dashboard.id = 'leetcode-friend-tracker-dashboard';
  dashboard.classList.add('leetcode-friend-dashboard');
  dashboard.style.display = 'none';

  const closeButton = document.createElement('button');
  closeButton.classList.add('dashboard-close-btn');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    dashboard.style.display = 'none';
  });

  const dashboardContent = document.createElement('div');
  dashboardContent.classList.add('dashboard-content');

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('dashboard.html');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  dashboardContent.appendChild(iframe);
  dashboard.appendChild(closeButton);
  dashboard.appendChild(dashboardContent);
  return dashboard;
}

function toggleDashboard() {
  const dashboard = document.getElementById('leetcode-friend-tracker-dashboard');
  if (dashboard) {
    dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
  }
}

function injectButton() {
  const navbar = document.querySelector('nav');
  if (!navbar || document.getElementById('leetcode-friend-tracker-btn')) return;

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('nav-item');
  buttonContainer.appendChild(createTrackerButton());

  const navItems = navbar.querySelectorAll('.nav-item');
  if (navItems.length > 0) {
    navbar.insertBefore(buttonContainer, navItems[navItems.length - 1]);
  } else {
    navbar.appendChild(buttonContainer);
  }

  if (!document.getElementById('leetcode-friend-tracker-dashboard')) {
    document.body.appendChild(createDashboard());
  }
}

function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    const navbar = document.querySelector('nav');
    if (navbar && !document.getElementById('leetcode-friend-tracker-btn')) {
      injectButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectButton();
    observeDOMChanges();
  });
} else {
  injectButton();
  observeDOMChanges();
}