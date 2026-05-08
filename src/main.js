import { fetchDashboard, fetchDashboardByDate } from './js/api.js';
import { updateCard, animateValue } from './js/cards.js';
import { renderRanapMasukChart } from './js/charts.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Indonesian } from 'flatpickr/dist/l10n/id.js';

// ============================================
// State
// ============================================
let currentFilter = 'today';
let autoRefreshInterval = null;
const AUTO_REFRESH_MS = 30000; // 30 seconds

// ============================================
// DOM Elements
// ============================================
const loadingOverlay = document.getElementById('loadingOverlay');
const filterButtons = document.querySelectorAll('.filter-btn');
const customDatePicker = document.getElementById('customDatePicker');
const customDateInput = document.getElementById('customDateInput');
const lastUpdatedEl = document.getElementById('lastUpdated');

// ============================================
// Initialize
// ============================================
async function init() {
  setupEventListeners();
  await loadData();
  startAutoRefresh();
}

// ============================================
// Data Loading
// ============================================
async function loadData(date = null) {
  showLoading();

  try {
    let response;

    if (date) {
      response = await fetchDashboardByDate(date);
    } else {
      response = await fetchDashboard();
    }

    if (response.success) {
      hideError();
      renderDashboard(response.data);
      updateLastUpdated(response.lastUpdated || response.data.lastUpdated);
    } else {
      showError(response.error || 'Gagal memuat data');
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    showError(`Koneksi gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// Render Dashboard
// ============================================
function renderDashboard(data) {
  // Update stat cards
  updateCard('rajal', data.rawatJalan);
  updateCard('igd', data.igd);
  updateCard('hd', data.hd);
  updateCard('ranapMasuk', data.ranapMasuk);

  // Total ranap aktif
  const ranapTotalEl = document.getElementById('ranapTotalValue');
  if (ranapTotalEl) {
    animateValue(ranapTotalEl, data.ranapAktif.total);
  }

  // Occupancy bar
  const occupancyFill = document.getElementById('occupancyFill');
  const occupancyPct = document.getElementById('occupancyPct');
  if (occupancyFill && occupancyPct) {
    // Delay for animation effect
    setTimeout(() => {
      occupancyFill.style.width = `${data.ranapAktif.occupancy}%`;
    }, 300);
    occupancyPct.textContent = `${data.ranapAktif.occupancy}%`;
  }

  // Mini chart
  if (data.ranapMasuk.weekly && data.ranapMasuk.weekly.length > 0) {
    renderRanapMasukChart(data.ranapMasuk.weekly);
  }
}

// ============================================
// Date Filter
// ============================================
let fp = null;

function setupEventListeners() {
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => handleFilterClick(btn));
  });

  // Init Flatpickr
  if (customDateInput) {
    fp = flatpickr(customDateInput, {
      locale: Indonesian,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j F Y',
      maxDate: 'today',
      disableMobile: true,
      theme: 'material_blue',
      onChange: (selectedDates, dateStr) => {
        if (dateStr) {
          currentFilter = 'custom';
          loadData(dateStr);
        }
      },
    });
  }
}

function handleFilterClick(btn) {
  const filter = btn.dataset.filter;

  // Update active state
  filterButtons.forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  // Show/hide custom picker
  if (filter === 'custom') {
    customDatePicker?.classList.remove('hidden');
    return;
  } else {
    customDatePicker?.classList.add('hidden');
  }

  currentFilter = filter;

  // Load data based on filter
  switch (filter) {
    case 'today':
      loadData();
      break;
    case 'kemarin': {
      const kemarin = new Date();
      kemarin.setDate(kemarin.getDate() - 1);
      loadData(formatDate(kemarin));
      break;
    }
    case 'week': {
      // Start of this week (Monday)
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      loadData(formatDate(new Date())); // Load current day within week context
      break;
    }
  }
}

// Flatpickr handles date selection via onChange callback

// ============================================
// Auto Refresh
// ============================================
function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(() => {
    if (currentFilter === 'today') {
      loadData();
    }
  }, AUTO_REFRESH_MS);
}

// ============================================
// Loading States
// ============================================
function showLoading() {
  loadingOverlay?.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay?.classList.add('hidden');
}

function showError(message) {
  let toast = document.getElementById('errorToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'errorToast';
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-toast-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span class="error-message"></span>
      </div>
    `;
    document.getElementById('app').prepend(toast);
  }
  toast.querySelector('.error-message').textContent = message;
  toast.classList.add('visible');
}

function hideError() {
  const toast = document.getElementById('errorToast');
  if (toast) toast.classList.remove('visible');
}

// ============================================
// Utilities
// ============================================
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function updateLastUpdated(timestamp) {
  if (!lastUpdatedEl || !timestamp) return;

  const date = new Date(timestamp);
  const formatted = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';

  lastUpdatedEl.textContent = formatted;
}

// ============================================
// Start the app
// ============================================
document.addEventListener('DOMContentLoaded', init);
