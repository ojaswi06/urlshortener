import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import Url from "./models/url.js";
import Click from "./models/click.js";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());

// CORS: Allow all origins for now (change in production)
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Serve frontend (index.html, script.js, style.css)
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
  const shortUrl = `${process.env.BACKEND_URL}/${shortId}`;

  const urlData = new Url({ longUrl, shortId, clicks: 0 });
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

    // Redirect to original URL
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

    // Clicks per hour
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
