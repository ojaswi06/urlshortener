const urlParams = new URLSearchParams(window.location.search);
const shortId = urlParams.get("shortId");

const totalClicksEl = document.getElementById("totalClicks");
const uniqueVisitorsEl = document.getElementById("uniqueVisitors");
const ctx = document.getElementById("clickChart").getContext("2d");

const backendURL = "https://urlshortenerbackend-4yhm.onrender.com";

function goBack() {
  window.location.href = "/";
}

let chart;

async function fetchAnalytics() {
  if (!shortId) return alert("ShortId not provided");

  try {
    const res = await fetch(`${backendURL}/an/${shortId}`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    const data = await res.json();

    totalClicksEl.textContent = data.totalClicks ?? 0;
    uniqueVisitorsEl.textContent = data.uniqueVisitors ?? 0;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const clicks = hours.map(h => data.clicksPerHour && data.clicksPerHour[h] ? data.clicksPerHour[h] : 0);

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: hours.map(h => `${h}:00`),
        datasets: [{
          label: 'Clicks per hour',
          data: clicks,
          backgroundColor: 'rgba(54,162,235,0.6)',
          borderColor: 'rgba(0,0,0,1)',
          borderWidth: 1
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
    alert("Failed to fetch analytics. See console for details.");
  }
}

fetchAnalytics();
setInterval(fetchAnalytics, 5000);
