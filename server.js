// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { nanoid } = require("nanoid");
require("dotenv").config();

// Models
const Url = require("./models/url");
const Click = require("./models/click");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend if placed in 'public' folder

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes

// Shorten URL
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ error: "Please provide a URL" });

  try {
    const shortId = nanoid(6);
    const newUrl = new Url({ longUrl, shortId });
    await newUrl.save();

    res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Redirect short URL
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    const url = await Url.findOne({ shortId });
    if (!url) return res.status(404).send("URL not found");

    // Record click
    await Click.create({
      urlId: url._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.redirect(url.longUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Analytics dashboard
app.get("/dashboard/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    const url = await Url.findOne({ shortId });
    if (!url) return res.status(404).json({ error: "URL not found" });

    const clicks = await Click.find({ urlId: url._id });

    res.json({
      shortId: url.shortId,
      totalClicks: clicks.length,
      uniqueVisitors: new Set(clicks.map((c) => c.ip)).size,
      analytics: clicks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check (optional)
app.get("/health", (req, res) => {
  res.send("Server is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
