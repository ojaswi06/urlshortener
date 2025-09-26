const urlParams = new URLSearchParams(window.location.search);
const shortId = urlParams.get("shortId");

const totalClicksEl = document.getElementById("totalClicks");
const uniqueVisitorsEl = document.getElementById("uniqueVisitors");
const longUrlEl = document.getElementById("longUrl");
const ctx = document.getElementById("clickChart").getContext("2d");

function goBack() {
  window.location.href = "/";
}

let chart;

async function fetchAnalytics() {
  if (!shortId) return alert("ShortId not provided");
  const res = await fetch(`/an/${shortId}`);
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
}

// Fetch analytics every 5 seconds
fetchAnalytics();
setInterval(fetchAnalytics, 5000);
