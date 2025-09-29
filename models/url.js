import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  longUrl: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Url", urlSchema);
