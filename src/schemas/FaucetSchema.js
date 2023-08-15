const mongoose = require("mongoose");

const faucetSchema = new mongoose.Schema(
  {
    discord_id: { type: String, required: true },
    withdraw_id: { type: String, required: true },
    claimers_ids: [{ type: String, required: true }],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.faucets || mongoose.model("faucets", faucetSchema);
