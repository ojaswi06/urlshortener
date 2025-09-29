const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { nanoid } = require("nanoid");
require("dotenv").config();

const Url = require("./models/url");
const Click = require("./models/click");

const app = express();
app.use(cors({ origin: "*" })); // allow all origins (can restrict later)
app.use(bodyParser.json());

// --- Shorten URL ---
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ message: "Missing longUrl" });

  const shortId = nanoid(6);

  // Always include https://
  const baseUrl = process.env.BACKEND_URL || `https://${req.get("host")}`;
  const shortUrl = `${baseUrl}/${shortId}`;

  const urlData = new Url({ longUrl, shortId });
  await urlData.save();

  res.json({ shortId, shortUrl });
});

// --- Redirect short URL ---
app.get("/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  try {
    const urlData = await Url.findOne({ shortId });
    if (!urlData) return res.status(404).send("Not Found");

    // Record click
    await Click.create({ shortId, timestamp: new Date(), ip: req.ip });

    res.redirect(urlData.longUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// --- Analytics ---
app.get("/an/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  try {
    const totalClicks = await Click.countDocuments({ shortId });
    const clicks = await Click.find({ shortId });

    const uniqueVisitors = new Set(clicks.map(c => c.ip)).size;

    const clicksPerHour = {};
    clicks.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      clicksPerHour[hour] = (clicksPerHour[hour] || 0) + 1;
    });

    res.json({ totalClicks, uniqueVisitors, clicksPerHour });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
