const shortenBtn = document.getElementById("shortenBtn");
const longUrlInput = document.getElementById("longUrl");
const resultBox = document.getElementById("result");
const shortUrlLink = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const dashboardBtn = document.getElementById("dashboardBtn");

shortenBtn.addEventListener("click", async () => {
  const longUrl = longUrlInput.value.trim();
  if (!longUrl) return alert("Please enter a URL!");

  const res = await fetch("/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ longUrl })
  });
  const data = await res.json();
  shortUrlLink.href = data.shortUrl;
  shortUrlLink.textContent = data.shortUrl;
  resultBox.style.display = "block";
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(shortUrlLink.textContent);
  alert("Copied to clipboard!");
});

dashboardBtn.addEventListener("click", () => {
  const shortId = shortUrlLink.textContent.split("/").pop();
  window.location.href = `/dashboard.html?shortId=${shortId}`;
});
