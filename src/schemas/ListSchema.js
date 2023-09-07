const mongoose = require("mongoose");

const listsSchema = new mongoose.Schema(
  {
    guild_id: { type: String, required: true },
    role_id: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.lists || mongoose.model("lists", listsSchema);
