const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Record = require("../models/record");
const userSchema = mongoose.Schema(
  {
    // Username .
    // Security Pin .
    // Email id .
    // Roll Number .
    // Reg Number .

    userName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Not a valid Email");
        }
      },
    },
    rollNumber: {
      type: Number,
      required: true,
      length: 5,
      unique: true,
    },
    regNumber: {
      type: String,
      required: true,
      minlength: 6,
      unique: true,
    },
    securityPin: {
      type: Number,
      required: true,
      minlength: 6,
      trim: true,
    },
    currentLab: {
      type: Number,
      default: -1,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.virtual("records", {
  ref: "Record",
  localField: "_id",
  foreignField: "entryUser",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, "imafullstackdeveloper");
  user.tokens = user.tokens.concat({ token });

  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to Login"); // Doing this purposefully
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to Login"); // Doing this purposefully
  }
  return user;
};

// Hashing passwords for security
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
