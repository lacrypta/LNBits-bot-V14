const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema(
  {
    discord_id: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ranking || mongoose.model("ranking", rankingSchema);
