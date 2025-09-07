const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { nanoid } = require("nanoid");
require("dotenv").config();

const Url = require("./models/url");
const Click = require("./models/click");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Shorten URL
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ error: "Long URL is required" });

  const shortId = nanoid(6);
  const newUrl = new Url({ longUrl, shortId });
  await newUrl.save();

  res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
});

// Redirect short URL to long URL
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;
  const url = await Url.findOne({ shortId });

  if (!url) return res.status(404).json({ error: "URL not found" });

  await Click.create({
    urlId: url._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  res.redirect(url.longUrl);
});

// Analytics route
app.get("/an/:shortId", async (req, res) => {
  const { shortId } = req.params;
  const url = await Url.findOne({ shortId });

  if (!url) return res.status(404).json({ error: "URL not found" });

  const clicks = await Click.find({ urlId: url._id });

  res.json({
    shortId: url.shortId,
    totalClicks: clicks.length,
    uniqueVisitors: new Set(clicks.map(c => c.ip)).size,
    analytics: clicks
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
