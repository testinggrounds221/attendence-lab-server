const express = require("express");
const router = express.Router();
// const { ObjectID, ObjectId } = require("mongodb");
const auth = require("../middleware/auth");
const User = require("../models/user");

const { sendWelcomeEmail } = require("../emails/accounts");

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  const token = await user.generateAuthToken();

  try {
    await user.save().catch((error) => res.status(400).send(error));
    sendWelcomeEmail(user.email, user.name, req.body.securityPin);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// auth is middleware
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(404).send("No such User");
    }
    console.log(user.id);
    res.send(user);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);

  const allowedUpdates = ["userName", "email", "password", "roll"]; // TODO IM HERE
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

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
