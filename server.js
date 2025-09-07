const shortenBtn = document.getElementById("shortenBtn");
const longUrlInput = document.getElementById("longUrl");
const resultBox = document.getElementById("result");
const shortUrlLink = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const dashboardBtn = document.getElementById("dashboardBtn");

// Backend on Render
const backendURL = "https://urlshortenerbackend-4yhm.onrender.com";

// Validate URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

shortenBtn.addEventListener("click", async () => {
  const longUrl = longUrlInput.value.trim();
  if (!longUrl) return alert("Please enter a URL!");
  if (!isValidUrl(longUrl)) return alert("Please enter a valid URL!");

  shortenBtn.disabled = true;
  shortenBtn.textContent = "Shortening...";

  try {
    const res = await fetch(`${backendURL}/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ longUrl })
    });

    if (!res.ok) throw new Error("Failed to shorten URL");

    const data = await res.json();
    shortUrlLink.href = `${backendURL}/${data.shortId}`;
    shortUrlLink.textContent = `${backendURL}/${data.shortId}`;
    resultBox.style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Error connecting to backend. Make sure backend is deployed!");
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "Shorten";
  }
});

copyBtn.addEventListener("click", () => {
  if (shortUrlLink.textContent) {
    navigator.clipboard.writeText(shortUrlLink.textContent);
    alert("Copied to clipboard!");
  }
});

dashboardBtn.addEventListener("click", () => {
  if (!shortUrlLink.textContent) return;
  const shortId = shortUrlLink.textContent.split("/").pop();
  window.location.href = `dashboard.html?shortId=${shortId}`;
});
