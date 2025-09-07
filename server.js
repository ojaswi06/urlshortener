const express = require("express"); 
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { nanoid } = require("nanoid");
require("dotenv").config();

const Url = require("./models/Url");
const Click = require("./models/Click");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("Error:", err));

// Shorten URL
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  const shortId = nanoid(6);

  const newUrl = new Url({ longUrl, shortId });
  await newUrl.save();

  res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
});

// Redirect and track clicks
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

// Analytics
app.get("/an/:shortId", async (req, res) => {
  const { shortId } = req.params;
  const url = await Url.findOne({ shortId });
  if (!url) return res.status(404).json({ error: "URL not found" });

  const clicks = await Click.find({ urlId: url._id });

  const clicksPerHour = Array(24).fill(0);
  clicks.forEach(c => {
    const hour = new Date(c.createdAt).getHours();
    clicksPerHour[hour]++;
  });

  res.json({
    longUrl: url.longUrl,
    shortId: url.shortId,
    totalClicks: clicks.length,
    uniqueVisitors: new Set(clicks.map(c => c.ip)).size,
    clicksPerHour
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
