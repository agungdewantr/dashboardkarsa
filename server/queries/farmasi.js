export const QUERY_PERENCANAAN_OBAT = `
SELECT 
    db.kode_brng,
    db.nama_brng,
    ks.satuan,
    j.nama AS kategori_obat,
    
    -- 1. Total Pemakaian Pasien Selama Periode Analisis (Misal: 30 Hari Terakhir)
    IFNULL(pakai.total_keluar, 0) AS total_pemakaian_30hari,
    
    -- 2. Rata-rata Pemakaian Per Hari (ADC / Average Daily Consumption)
    ROUND(IFNULL(pakai.total_keluar, 0) / 30, 2) AS konsumsi_per_hari,
    
    -- 3. Estimasi Kebutuhan 1 Minggu (7 Hari) ke Depan
    CEIL((IFNULL(pakai.total_keluar, 0) / 30) * 7) AS estimasi_kebutuhan_7hari,
    
    -- 4. Posisi Stok Riil Saat Ini (Akumulasi Seluruh Gudang/Depo)
    IFNULL(stok.total_stok_saat_ini, 0) AS stok_saat_ini,
    
    -- 5. Rekomendasi Jumlah Pengadaan / Order
    -- Rumus: Kebutuhan 7 Hari - Stok Saat Ini (Jika minus dihitung 0)
    CASE 
        WHEN (CEIL((IFNULL(pakai.total_keluar, 0) / 30) * 7) - IFNULL(stok.total_stok_saat_ini, 0)) > 0 
        THEN (CEIL((IFNULL(pakai.total_keluar, 0) / 30) * 7) - IFNULL(stok.total_stok_saat_ini, 0))
        ELSE 0 
    END AS rekomendasi_order_7hari,

    -- 6. Status Kesiapan Stok
    CASE 
        WHEN IFNULL(stok.total_stok_saat_ini, 0) <= 0 THEN 'KRITIS (Stok Kosong)'
        WHEN IFNULL(stok.total_stok_saat_ini, 0) < CEIL((IFNULL(pakai.total_keluar, 0) / 30) * 7) THEN 'KURANG (Order Diperlukan)'
        ELSE 'AMAN'
    END AS status_perencanaan

FROM databarang db
JOIN kodesatuan ks ON db.kode_sat = ks.kode_sat
LEFT JOIN jenis j ON db.kdjns = j.kdjns

-- Subquery Menghitung Total Obat Keluar ke Pasien (30 Hari Terakhir)
LEFT JOIN (
    SELECT 
        dpo.kode_brng,
        SUM(dpo.jml) AS total_keluar
    FROM detail_pemberian_obat dpo
    WHERE dpo.tgl_perawatan BETWEEN DATE_SUB('2026-05-22', INTERVAL 30 DAY) AND '2026-05-22'
    GROUP BY dpo.kode_brng
) pakai ON db.kode_brng = pakai.kode_brng

-- Subquery Akumulasi Stok di Semua Depo
LEFT JOIN (
    SELECT 
        gb.kode_brng,
        SUM(gb.stok) AS total_stok_saat_ini
    FROM gudangbarang gb
    GROUP BY gb.kode_brng
) stok ON db.kode_brng = stok.kode_brng

WHERE db.status = '1' -- Master obat aktif
  AND IFNULL(pakai.total_keluar, 0) > 0 -- Hanya obat yang ada pemakaian
ORDER BY total_pemakaian_30hari DESC;
`;
