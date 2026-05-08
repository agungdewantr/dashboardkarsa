import cron from 'node-cron';
import cache, { CACHE_KEYS } from './cache.js';
import { fetchAllDashboardData, generateDemoData } from '../queries/dashboard.js';

const isDemo = process.env.DEMO_MODE === 'true';

/**
 * Fetch data and store in cache
 */
async function refreshCache() {
  try {
    console.log(`[${new Date().toLocaleTimeString('id-ID')}] 🔄 Refreshing dashboard cache...`);

    let data;
    if (isDemo) {
      data = generateDemoData();
      console.log('  📦 Using demo data');
    } else {
      data = await fetchAllDashboardData();
      console.log('  ✅ MySQL query successful');
    }

    cache.set(CACHE_KEYS.DASHBOARD_TODAY, data);
    cache.set(CACHE_KEYS.LAST_UPDATED, new Date().toISOString());

    console.log(`  💾 Cache updated — Rajal: ${data.rawatJalan.total}, IGD: ${data.igd.total}, HD: ${data.hd.total}, Ranap Masuk: ${data.ranapMasuk.total}, Ranap Aktif: ${data.ranapAktif.total}`);
  } catch (error) {
    console.error('  ❌ Cache refresh failed:', error.message);
  }
}

/**
 * Start the scheduler
 */
export function startScheduler() {
  const schedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

  console.log(`📅 Scheduler started: "${schedule}"`);
  console.log(`📡 Mode: ${isDemo ? 'DEMO' : 'MYSQL'}`);

  // Initial fetch on startup
  refreshCache();

  // Schedule periodic refresh
  cron.schedule(schedule, () => {
    refreshCache();
  });
}

/**
 * Fetch data for a specific date (with caching)
 */
export async function fetchForDate(date) {
  const cacheKey = `${CACHE_KEYS.DASHBOARD_CUSTOM}_${date}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  let data;
  if (isDemo) {
    data = generateDemoData(date);
  } else {
    data = await fetchAllDashboardData(date);
  }

  // Cache custom date data for 10 minutes
  cache.set(cacheKey, data, 600);
  return data;
}

/**
 * Fetch data for a date range
 */
export async function fetchForDateRange(startDate, endDate) {
  const cacheKey = `${CACHE_KEYS.DASHBOARD_CUSTOM}_${startDate}_${endDate}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  // For date range, we aggregate data from start to end
  let data;
  if (isDemo) {
    // In demo, just generate for the end date with a label
    data = generateDemoData(endDate);
    data.dateRange = { start: startDate, end: endDate };
  } else {
    data = await fetchAllDashboardData(endDate);
    data.dateRange = { start: startDate, end: endDate };
  }

  cache.set(cacheKey, data, 600);
  return data;
}
