import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

import Url from "./models/url.js";
import Click from "./models/click.js";

dotenv.config();
const app = express();

// Allow cross-origin (development). You can restrict to your frontend origin later.
app.use(cors());
app.use(express.json());

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Serve static frontend files from public/ (so root shows index.html)
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * POST /shorten
 * Request body: { longUrl }
 * Response: { shortId, shortUrl }
 */
app.post("/shorten", async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).json({ error: "longUrl required" });

    const shortId = nanoid(6);
    const newUrl = new Url({ longUrl, shortId });
    await newUrl.save();

    // Build absolute https short URL. Use BACKEND_URL env or fallback to request host.
    const base = process.env.BACKEND_URL || `https://${req.get("host")}`;
    const shortUrl = `${base.replace(/\/$/, "")}/${shortId}`;

    return res.json({ shortId, shortUrl });
  } catch (err) {
    console.error("Shorten error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /:shortId
 * Redirect and track click
 */
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlData = await Url.findOne({ shortId });
    if (!urlData) return res.status(404).send("Short URL not found");

    // Track click. save urlId (object id) so analytics can query by urlId.
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
    await Click.create({
      urlId: urlData._id,
      shortId: urlData.shortId,
      ip,
      userAgent: req.headers["user-agent"]
    });

    // Optional increment (keeps totalClicks quickly available)
    urlData.clicks = (urlData.clicks || 0) + 1;
    await urlData.save();

    return res.redirect(urlData.longUrl);
  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Server Error");
  }
});

/**
 * GET /an/:shortId
 * Returns analytics JSON for given shortId
 */
app.get("/an/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlData = await Url.findOne({ shortId });
    if (!urlData) return res.status(404).json({ error: "Short URL not found" });

    const clicks = await Click.find({ urlId: urlData._id }).sort({ timestamp: 1 });

    // Unique visitors by IP
    const uniqueVisitors = new Set(clicks.map(c => c.ip)).size;

    // Clicks per hour (0..23)
    const clicksPerHour = clicks.reduce((acc, c) => {
      const hour = new Date(c.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      longUrl: urlData.longUrl,
      totalClicks: urlData.clicks || clicks.length,
      uniqueVisitors,
      clicksPerHour,
      clicks
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
