const API_BASE = '/api';

/**
 * Fetch dashboard data for today (from cache)
 */
export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  return res.json();
}

/**
 * Fetch dashboard data for a specific date
 */
export async function fetchDashboardByDate(date) {
  const res = await fetch(`${API_BASE}/dashboard/date/${date}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch dashboard data for a date range
 */
export async function fetchDashboardByRange(start, end) {
  const res = await fetch(`${API_BASE}/dashboard/range?start=${start}&end=${end}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch system status
 */
export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
