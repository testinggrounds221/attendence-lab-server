const mongoose = require("mongoose");

const recordSchema = mongoose.Schema(
  {
    entryUser: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
  }
);
const Record = mongoose.model("Record", recordSchema);

module.exports = Record;
