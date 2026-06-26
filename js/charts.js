// ─── GRÁFICOS (Chart.js) ──────────────────────────────────

let charts = {};

function chartOpts(hideGrid = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#55556a', font: { size: 10 } },
        grid: { color: hideGrid ? 'transparent' : '#1c1c21' }
      },
      y: {
        ticks: { color: '#55556a', font: { size: 10 } },
        grid: { color: '#1c1c21' },
        beginAtZero: true
      }
    }
  };
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function renderChartSemana() {
  const labels = [], vals = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const str = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
    const total = window.DB ? DB.registros.filter(r => r.data === str).reduce((s, r) => s + r.total, 0) : 0;
    vals.push(total);
  }
  destroyChart('chart-semana');
  const canvas = document.getElementById('chart-semana');
  if (!canvas) return;
  charts['chart-semana'] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ data: vals, backgroundColor: '#d63031', borderRadius: 2 }] },
    options: chartOpts()
  });
}

function renderChartPeriodoDash() {
  const periodos = ['Manhã', 'Tarde', 'Noturno'];
  const vals = periodos.map(p => (window.DB ? DB.registros.filter(r => r.periodo === p).reduce((s, r) => s + r.total, 0) : 0));
  destroyChart('chart-periodo');
  const canvas = document.getElementById('chart-periodo');
  if (!canvas) return;
  charts['chart-periodo'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: periodos,
      datasets: [{ data: vals, backgroundColor: ['#d63031', '#e17055', '#0984e3'], borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9090a8', font: { size: 11 } } } }
    }
  });
}

// Adicione outras funções de gráficos conforme necessário