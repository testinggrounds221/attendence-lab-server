const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Record = require("../models/record");
const { ObjectID, ObjectId } = require("mongodb");

router.post("/records", auth, async (req, res) => {
  const record = new Record({ ...req.body, owner: req.user._id });
  try {
    await record.save();
    res.status(201).send(record);
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/records/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send();
  }

  try {
    const record = await Record.findOne({ _id, owner: req.user._id });
    if (!record) {
      return res.status(404).send();
    }
    res.send(record);
  } catch (e) {
    res.status(500).send();
  }
});

// GET /records?completed=true
// GET /records?limit=10&skip=10
// GET /records?sortBy=createdAt:desc

router.get("/records", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "records",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.records);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
