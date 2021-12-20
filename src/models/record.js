const mongoose = require("mongoose");

const recordSchema = mongoose.Schema(
  {
    entryUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    recordStatus: {
      type: Number,
      required: true,
      default: 0,
    },
    labID: {
      type: Number,
      required: true,
    },
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "session",
  }
);
const Record = mongoose.model("Record", recordSchema);

module.exports = Record;
