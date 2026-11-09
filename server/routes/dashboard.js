import { Router } from 'express';
import cache, { CACHE_KEYS } from '../services/cache.js';
import { fetchForDate, fetchForDateRange } from '../services/scheduler.js';
import db from '../config/database.js';
import { QUERY_PERENCANAAN_OBAT } from '../queries/farmasi.js';

const router = Router();

/**
 * GET /api/dashboard
 * Returns cached dashboard data for today
 */
router.get('/dashboard', (req, res) => {
  const data = cache.get(CACHE_KEYS.DASHBOARD_TODAY);
  const lastUpdated = cache.get(CACHE_KEYS.LAST_UPDATED);

  if (!data) {
    return res.status(503).json({
      error: 'Data belum tersedia, silakan tunggu...',
      lastUpdated: null,
    });
  }

  res.json({
    success: true,
    data,
    lastUpdated,
    source: 'cache',
  });
});

/**
 * GET /api/dashboard/date/:date
 * Returns dashboard data for a specific date (YYYY-MM-DD)
 */
router.get('/dashboard/date/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(date)) {
      return res.status(400).json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD atau YYYY-MM-DD HH:mm:ss' });
    }

    const data = await fetchForDate(date);
    res.json({
      success: true,
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching date data:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

/**
 * GET /api/dashboard/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns dashboard data for a date range
 */
router.get('/dashboard/range', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Parameter start dan end diperlukan' });
    }

    if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(start) || !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(end)) {
      return res.status(400).json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD atau YYYY-MM-DD HH:mm:ss' });
    }

    const data = await fetchForDateRange(start, end);
    res.json({
      success: true,
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching range data:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

/**
 * GET /api/status
 * Health check + cache info
 */
router.get('/status', (req, res) => {
  const lastUpdated = cache.get(CACHE_KEYS.LAST_UPDATED);
  const stats = cache.getStats();

  res.json({
    status: 'ok',
    mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'mysql',
    cache: {
      keys: cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
    },
    lastUpdated,
    uptime: process.uptime(),
  });
});

/**
 * GET /api/farmasi/perencanaan-stok
 * Menjalankan query untuk proyeksi kebutuhan dan rekomendasi order
 */
router.get('/farmasi/perencanaan-stok', async (req, res) => {
  try {
    const [rows] = await db.query(QUERY_PERENCANAAN_OBAT);
    // Kita ubah sedikit struktur datanya agar cocok dengan frontend jika perlu,
    // namun karena datanya sudah mirip (snake_case -> JSON properties), cukup kirimkan
    res.json(rows);
  } catch (error) {
    console.error('Error fetching farmasi data:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data farmasi' });
  }
});

export default router;
