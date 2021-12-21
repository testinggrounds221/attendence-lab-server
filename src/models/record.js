const mongoose = require("mongoose");

const commonFields = {
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
  session: {
    type: Number,
    required: true,
    default: 0,
  },
};

const recordSchema = mongoose.Schema(commonFields, {
  timestamps: true,
  collection: "session",
});

const archiveSchema = mongoose.Schema(commonFields, {
  timestamps: true,
  collection: "archive",
});

const Record = mongoose.model("Record", recordSchema);
const Archive = mongoose.model("Archive", archiveSchema);

module.exports = { Record, Archive };
