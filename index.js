const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const mongoose = require("mongoose");
const dotenv=require("dotenv").config()
const interviewRoute = require("./routes/InterviewRoute");
const app = express();
app.use(cors());
app.use(express.json());
mongoose
  .connect(
    process.env.DB_URL,{})
  .then((con) => {
    console.log("connected to db ");
  }).catch(err=>{
    console.log(err)
  });
app.use("/interview", interviewRoute);
app.use("/auth", authRoute);
module.exports = app;
