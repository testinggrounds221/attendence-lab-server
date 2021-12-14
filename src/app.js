const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const recordRouter = require("./routers/record");

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(recordRouter);

module.exports = app;
