const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  experience: { type: String, default: "0 years" },
  endDate: { type: Date, required: true },

});
const jobPostings=new mongoose.model("jobPostings",schema)
module.exports=jobPostings;