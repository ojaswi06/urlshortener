const backendURL = "https://urlshortenerbackend-4yhm.onrender.com";

async function fetchAnalytics() {
  if (!shortId) return alert("ShortId not provided");
  try {
    const res = await fetch(`${backendURL}/an/${shortId}`);
    const data = await res.json();

    totalClicksEl.textContent = data.totalClicks;
    uniqueVisitorsEl.textContent = data.uniqueVisitors;

    const hours = Array.from({length: 24}, (_, i) => i);
    const clicks = hours.map(h => data.clicksPerHour[h] || 0);

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours.map(h => `${h}:00`),
        datasets: [{
          label: 'Clicks per hour',
          data: clicks,
          backgroundColor: 'rgba(37, 34, 34, 0.6)',
          borderColor: 'rgba(255,255,255,1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, ticks: { color: '#000000ff' } },
          x: { ticks: { color: '#000000ff' } }
        },
        plugins: {
          legend: { labels: { color: '#000000ff' } }
        }
      }
    });
  } catch(err) {
    console.error("Failed to fetch analytics:", err);
  }
}
