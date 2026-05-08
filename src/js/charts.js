let ranapChart = null;

/**
 * Create or update the mini bar chart for rawat inap masuk
 */
export function renderRanapMasukChart(weeklyData) {
  const canvas = document.getElementById('ranapMasukChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Prepare data
  const labels = weeklyData.map((d) => {
    const date = new Date(d.tanggal);
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  });
  const values = weeklyData.map((d) => d.total);

  // Destroy existing chart
  if (ranapChart) {
    ranapChart.destroy();
  }

  ranapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, i) =>
            i === values.length - 1 ? '#1e3a5f' : '#bfdbfe'
          ),
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
          minBarLength: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 11 },
          bodyFont: { family: 'Inter', size: 12, weight: '600' },
          padding: { x: 12, y: 8 },
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `${item.raw} pasien`,
          },
        },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false },
        },
        y: {
          display: false,
          grid: { display: false },
          beginAtZero: true,
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutCubic',
      },
    },
  });
}
