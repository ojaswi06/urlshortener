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
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Shorten URL ---
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  if (!longUrl) return res.status(400).json({ message: "Missing longUrl" });

  const shortId = nanoid(6);
  const shortUrl = `${process.env.BACKEND_URL || "https://urlshortenerbackend-4yhm.onrender.com"}/${shortId}`;

  const newUrl = new Url({ longUrl, shortId });
  await newUrl.save();

  res.json({ shortId, shortUrl });
});

// --- Redirect & Track Clicks ---
app.get("/:shortId", async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const urlData = await Url.findOne({ shortId });
    if (!urlData) return res.status(404).send("Short URL not found");

    // Track click with urlId
    await Click.create({
      urlId: urlData._id,              // 👈 Must include for validation
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      timestamp: new Date()
    });

    res.redirect(urlData.longUrl);
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).send("Server Error");
  }
});

// --- Analytics ---
app.get("/an/:shortId", async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const urlData = await Url.findOne({ shortId });
    if (!urlData) return res.status(404).json({ message: "Short URL not found" });

    const clicks = await Click.find({ urlId: urlData._id }).sort({ timestamp: 1 });
    const totalClicks = clicks.length;
    const uniqueVisitors = new Set(clicks.map(c => c.ip)).size;

    // Clicks per hour
    const clicksPerHour = {};
    clicks.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      clicksPerHour[hour] = (clicksPerHour[hour] || 0) + 1;
    });

    res.json({ longUrl: urlData.longUrl, totalClicks, uniqueVisitors, clicksPerHour, clicks });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
