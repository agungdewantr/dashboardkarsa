import pool from '../config/database.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const TZ = 'Asia/Jakarta';

/**
 * Get today and kemarin dates in WIB timezone
 */
function getDates() {
  const now = dayjs().tz(TZ);

  return {
    today: now.format('YYYY-MM-DD'),
    kemarin: now.subtract(1, 'day').format('YYYY-MM-DD'),
    weekStart: now.startOf('isoWeek').format('YYYY-MM-DD'),
  };
}

/**
 * ============================================================
 * SIMRS KHANZA QUERIES
 * ============================================================
 * Sesuaikan query di bawah ini dengan struktur tabel SIMRS Khanza.
 * Tabel yang umum digunakan:
 *   - reg_periksa       → registrasi rawat jalan
 *   - kamar_inap        → rawat inap
 *   - bangsal           → data bangsal (kapasitas)
 *   - dokter            → data dokter
 *   - poliklinik        → data poliklinik
 * ============================================================
 */

/**
 * Query jumlah rawat jalan hari tertentu
 * Tabel: reg_periksa (SIMRS Khanza)
 */
export async function getJumlahRawatJalan(startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT
  COUNT(reg.no_rawat) as total
FROM
  reg_periksa reg
  INNER JOIN poliklinik pl ON pl.kd_poli = reg.kd_poli
WHERE
  reg.tgl_registrasi BETWEEN ? AND ?
  AND reg.stts != 'Batal'
  AND pl.kd_poli_rl5 IS NOT NULL
  AND reg.kd_poli != 'IGDK' AND reg.kd_poli != '1022'`,
    [startDate, endDate]
  );
  return rows[0]?.total || 0;
}

/**
 * Query jumlah IGD hari tertentu
 * Tabel: reg_periksa + poliklinik
 */
export async function getJumlahIGD(startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT
  COUNT(no_rawat) as total
FROM
  reg_periksa 
WHERE
  tgl_registrasi BETWEEN ? AND ?
  AND kd_poli = 'IGDK'
  AND stts != 'Batal'`,
    [startDate, endDate]
  );
  return rows[0]?.total || 0;
}

/**
 * Query jumlah HD (Hemodialisa) hari tertentu
 * Tabel: reg_periksa + poliklinik
 */
export async function getJumlahHD(startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT
  COUNT(no_rawat) as total
FROM
  reg_periksa 
WHERE
  tgl_registrasi BETWEEN ? AND ?
  AND kd_poli = '1022'
  AND stts != 'Batal'`,
    [startDate, endDate]
  );
  return rows[0]?.total || 0;
}

/**
 * Query jumlah rujuk internal hari tertentu
 * Tabel: kamar_inap
 */
export async function getJumlahRanapMasuk(startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT
  COUNT(rjk.no_rawat) as total
FROM
  rujukan_internal_poli rjk
  INNER JOIN reg_periksa reg ON reg.no_rawat = rjk.no_rawat
WHERE
  reg.tgl_registrasi BETWEEN ? AND ?
  AND reg.stts != 'Batal'`,
    [startDate, endDate]
  );
  return rows[0]?.total || 0;
}

/**
 * Query total pasien rawat inap saat ini (belum pulang)
 * Tabel: kamar_inap
 */
export async function getTotalRanapAktif(date) {
  const [rows] = await pool.query(
    `SELECT DISTINCT
kamar_inap.no_rawat,
pasien.nm_pasien
FROM
kamar_inap
INNER JOIN reg_periksa ON kamar_inap.no_rawat = reg_periksa.no_rawat
INNER JOIN pasien ON reg_periksa.no_rkm_medis = pasien.no_rkm_medis
WHERE stts_pulang='-'`
  );
  return rows.length;
}

/**
 * Query total kapasitas tempat tidur
 * Tabel: bangsal (atau kamar)
 */
export async function getKapasitasTT() {
  const [rows] = await pool.query(
    `SELECT
  COUNT(kd_kamar) as total
FROM
  kamar where statusdata = '1'`
  );
  return rows[0]?.total || 0;
}

/**
 * Query jumlah rujuk internal per hari (7 hari terakhir) untuk mini chart
 */
export async function getRanapMasukWeekly(endDate) {
  const [rows] = await pool.query(
    `SELECT reg.tgl_registrasi as tanggal, COUNT(rjk.no_rawat) as total 
     FROM rujukan_internal_poli rjk
     INNER JOIN reg_periksa reg ON reg.no_rawat = rjk.no_rawat
     WHERE reg.tgl_registrasi BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?
       AND reg.stts != 'Batal'
     GROUP BY reg.tgl_registrasi 
     ORDER BY reg.tgl_registrasi ASC`,
    [endDate, endDate]
  );

  // Buat map dari hasil query
  const dataMap = {};
  for (const row of rows) {
    const key = dayjs(row.tanggal).tz(TZ).format('YYYY-MM-DD');
    dataMap[key] = row.total;
  }

  // Isi 7 hari lengkap (termasuk hari tanpa data = 0)
  const result = [];
  const end = dayjs(endDate).tz(TZ);
  for (let i = 6; i >= 0; i--) {
    const key = end.subtract(i, 'day').format('YYYY-MM-DD');
    result.push({
      tanggal: key,
      total: dataMap[key] || 0,
    });
  }

  return result;
}

/**
 * Fetch semua data dashboard sekaligus (1 batch query)
 */
export async function fetchAllDashboardData(targetStartDate, targetEndDate) {
  const { today, kemarin, weekStart } = getDates();
  
  const startDate = targetStartDate || today;
  const endDate = targetEndDate || startDate;

  // Tentukan comparison date (bandingkan dengan rentang hari sebelumnya)
  let compStartDate, compEndDate;
  if (startDate === today && endDate === today) {
    compStartDate = kemarin;
    compEndDate = kemarin;
  } else {
    // Kurangi 1 hari dari startDate dan endDate
    compStartDate = dayjs(startDate).tz(TZ).subtract(1, 'day').format('YYYY-MM-DD');
    compEndDate = dayjs(endDate).tz(TZ).subtract(1, 'day').format('YYYY-MM-DD');
  }

  // Execute semua query secara parallel
  const [
    rajal,
    rajalPrev,
    igd,
    igdPrev,
    hd,
    hdPrev,
    ranapMasuk,
    ranapMasukPrev,
    ranapAktif,
    kapasitasTT,
    ranapWeekly,
  ] = await Promise.all([
    getJumlahRawatJalan(startDate, endDate),
    getJumlahRawatJalan(compStartDate, compEndDate),
    getJumlahIGD(startDate, endDate),
    getJumlahIGD(compStartDate, compEndDate),
    getJumlahHD(startDate, endDate),
    getJumlahHD(compStartDate, compEndDate),
    getJumlahRanapMasuk(startDate, endDate),
    getJumlahRanapMasuk(compStartDate, compEndDate),
    getTotalRanapAktif(),
    getKapasitasTT(),
    getRanapMasukWeekly(endDate), // Tetap pakai endDate untuk mini chart
  ]);

  // Calculate percentages
  const calcPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  const occupancy = kapasitasTT > 0
    ? parseFloat(((ranapAktif / kapasitasTT) * 100).toFixed(1))
    : 0;

  console.log(kapasitasTT);

  return {
    date: endDate,
    comparisonDate: compEndDate,
    rawatJalan: {
      total: rajal,
      previous: rajalPrev,
      percentage: calcPercentage(rajal, rajalPrev),
    },
    igd: {
      total: igd,
      previous: igdPrev,
      percentage: calcPercentage(igd, igdPrev),
    },
    hd: {
      total: hd,
      previous: hdPrev,
      percentage: calcPercentage(hd, hdPrev),
    },
    ranapMasuk: {
      total: ranapMasuk,
      previous: ranapMasukPrev,
      percentage: calcPercentage(ranapMasuk, ranapMasukPrev),
      weekly: ranapWeekly,
    },
    ranapAktif: {
      total: ranapAktif,
      kapasitas: kapasitasTT,
      occupancy,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Demo data generator (untuk development tanpa MySQL)
 */
export function generateDemoData(targetDate) {
  const today = new Date().toISOString().split('T')[0];
  const dateToUse = targetDate || today;

  // Randomize with some consistency
  const seed = dateToUse.split('-').reduce((a, b) => a + parseInt(b), 0);
  const rand = (min, max) => Math.floor(min + ((seed * 7 + max) % (max - min)));

  const rajal = rand(900, 1500);
  const rajalPrev = rand(850, 1400);
  const igd = rand(60, 120);
  const igdPrev = rand(55, 110);
  const hd = rand(30, 60);
  const hdPrev = rand(28, 55);
  const ranapMasuk = rand(80, 150);
  const ranapMasukPrev = rand(75, 140);
  const ranapAktif = rand(350, 500);
  const kapasitasTT = 530;

  const calcPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  // Weekly mini chart data
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(dateToUse);
    d.setDate(d.getDate() - i);
    weekly.push({
      tanggal: formatDate(d),
      total: rand(70 + i * 5, 140 + i * 3),
    });
  }

  return {
    date: dateToUse,
    comparisonDate: (() => {
      const d = new Date(dateToUse);
      d.setDate(d.getDate() - 1);
      return formatDate(d);
    })(),
    rawatJalan: {
      total: rajal,
      previous: rajalPrev,
      percentage: calcPercentage(rajal, rajalPrev),
    },
    igd: {
      total: igd,
      previous: igdPrev,
      percentage: calcPercentage(igd, igdPrev),
    },
    hd: {
      total: hd,
      previous: hdPrev,
      percentage: calcPercentage(hd, hdPrev),
    },
    ranapMasuk: {
      total: ranapMasuk,
      previous: ranapMasukPrev,
      percentage: calcPercentage(ranapMasuk, ranapMasukPrev),
      weekly,
    },
    ranapAktif: {
      total: ranapAktif,
      kapasitas: kapasitasTT,
      occupancy: parseFloat(((ranapAktif / kapasitasTT) * 100).toFixed(1)),
    },
    lastUpdated: new Date().toISOString(),
  };
}
