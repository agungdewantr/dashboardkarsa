document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('paretoChart');
  if (!ctx) return;

  const labels = [
    'Alcohol Swab', 'Superfix 15cm x 5m', 'Hand Schoen non ste...',
    'Decafix 15cm x 5m', 'Paracetamol tablet', 'Disp Spuit Stera 3...',
    'Disp Spuit Stera 10...', 'Masker Earloop', 'Atorvastatin 20 mg', 'Kapsul kosong no. 00'
  ];
  const barData = [50000, 28000, 26000, 18000, 15000, 12000, 10000, 8000, 6000, 5000];
  const lineData = [15, 25, 35, 45, 55, 65, 75, 80, 85, 90]; 

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          type: 'line',
          label: 'Kumulatif %',
          data: lineData,
          borderColor: '#E2E8F0',
          borderWidth: 2,
          pointBackgroundColor: '#E2E8F0',
          pointBorderColor: '#111d21',
          pointRadius: 4,
          fill: false,
          yAxisID: 'y1',
          tension: 0
        },
        {
          type: 'bar',
          label: 'Pemakaian',
          data: barData,
          backgroundColor: [
            '#DDA23B', // Kurang
            '#DDA23B',
            '#58B69A', // Aman
            '#58B69A',
            '#58B69A',
            '#58B69A',
            '#58B69A',
            '#58B69A',
            '#58B69A',
            '#DDA23B'
          ],
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: '#8F9CA3',
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(255,255,255,0.05)',
            drawBorder: false,
            tickLength: 0,
            borderDash: [4, 4]
          },
          ticks: {
            color: '#8F9CA3',
            stepSize: 12500,
            padding: 10,
            callback: function(value) {
              return value.toLocaleString('id-ID');
            }
          },
          min: 0,
          max: 50000
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { display: false, drawBorder: false },
          min: 0,
          max: 100,
          ticks: {
            color: '#8F9CA3',
            stepSize: 25,
            padding: 10,
            callback: function(value) {
              return value + '%';
            }
          }
          }
        }
      }
  });

  // Table expansion logic
  const expandableRows = document.querySelectorAll('.expandable-row');
  expandableRows.forEach(row => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');
      const detailRow = document.getElementById(targetId);
      if (detailRow) {
        const isExpanded = row.classList.contains('expanded');
        if (!isExpanded) {
          row.classList.add('expanded');
          detailRow.classList.add('show');
        } else {
          row.classList.remove('expanded');
          detailRow.classList.remove('show');
        }
      }
    });
  });
});
