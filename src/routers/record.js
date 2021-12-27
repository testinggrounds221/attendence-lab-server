const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Record, Archive } = require("../models/record");

const User = require("../models/user");

const { ObjectID, ObjectId } = require("mongodb");

router.post("/records", auth, async (req, res) => {
  try {
    if (req.user.currentLab == -1) {
      const newRecord = new Record({ ...req.body, entryUser: req.user._id });
      newRecord.recordStatus = 0;
      req.user.currentLab = newRecord.labID;
      newRecord.entryTime = Date();
      console.log(
        `User ${req.user.userName} ENTRY INTO LAB ${req.user.currentLab}`
      );
      await req.user.save();
      await newRecord.save();
      res.status(201).send(newRecord);
      return;
    } else {
      if (req.user.currentLab != req.body.labID) {
        res
          .status(409)
          .send(
            `Conflict Error ${req.user.userName} exit from ${req.user.currentLab} first`
          );
        return;
      } else {
        const existingRecord = await Record.findOne({
          entryUser: req.user._id,
          recordStatus: 0,
        });

        if (!existingRecord) {
          res
            .status(404)
            .send(
              `User ${req.user.userName} ENTRY RECORD NOT FOUND FOR LAB ${req.user.currentLab}`
            );
          return;
        }

        existingRecord.recordStatus = 1;
        existingRecord.exitTime = Date();
        console.log(
          `User ${req.user.userName} EXIT FROM LAB ${req.user.currentLab}`
        );

        req.user.currentLab = -1;
        await req.user.save();
        await existingRecord.save();
        res.status(201).send(existingRecord);
      }
    }
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.get("/records/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send();
  }

  try {
    const record = await Record.findOne({ _id, entryUser: req.user._id });
    if (!record) {
      return res.status(404).send();
    }
    res.send(record);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/records/getAttendence/:lid/:sesid", auth, async (req, res) => {
  const lid = req.params.lid;
  const sid = req.params.sesid;
  let bulkSearch = Archive.collection.initializeUnorderedBulkOp();

  try {
    const archives = await Archive.find({ labID: lid, session: sid });
    if (!archives.length) {
      res.status(201).send("No data to Send");
      return;
    }

    archives.forEach(function (doc) {
      console.log(doc.entryTime);
    });

    res.status(201).send("Migrated"); // SEND DATA HERE
  } catch (e) {
    res.status(500).send(e);
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

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);

  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ Error: "Invalid Field" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/records/migrate/:lid/:sesid", auth, async (req, res) => {
  const lid = req.params.lid;
  const sid = req.params.sesid;
  let bulkInsert = Archive.collection.initializeUnorderedBulkOp();
  let bulkRemove = Record.collection.initializeUnorderedBulkOp();
  //   let bulkModifyCurrentLab = User.collection.initializeUnorderedBulkOp();

  try {
    const records = await Record.find({ labID: lid, session: sid });
    if (!records.length) {
      res.status(404).send("No data to Migrate");
      return;
    }
    records.forEach(function (doc) {
      if (!doc.exitTime) {
        doc.exitTime = Date();
      }
      bulkInsert.insert(doc);
      bulkRemove.find({ _id: doc._id }).deleteOne();
    });
    // bulkModifyCurrentLab
    //   .find({ currentLab: lid })
    //   .update({ $set: { currentLab: -1 } });

    const updateDetails = await User.updateMany(
      { currentLab: lid },
      { currentLab: -1 }
    );
    console.log(updateDetails);
    bulkInsert.execute();
    bulkRemove.execute();

    res.status(201).send("Migrated Records"); //
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
