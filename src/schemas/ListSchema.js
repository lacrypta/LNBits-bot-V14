const mongoose = require("mongoose");

const listsSchema = new mongoose.Schema(
  {
    role_id: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.lists || mongoose.model("lists", listsSchema);
