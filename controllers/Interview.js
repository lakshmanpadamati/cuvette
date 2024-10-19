const nodemailer = require("nodemailer");
const jobPostings = require("./../models/JobPostings");
const dotenv = require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const User = require("./../models/user");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "laxmanpadamati6@gmail.com",
    pass: "cfatlkwwpxrjrvct",
  },
});
async function sendEmail(emails, data) {
  const { jobTitle, jobDescription, endDate, experience } = data;
  console.log(data);
  console.log("email sent ");
  const mailOptions = {
    from: "laxmanpadamati6@gmail.com",
    to: emails,
    subject: "Interview Call",
    text: `Dear Team,

  We are excited to announce a new job posting with the following details:

  - Job Title: ${jobTitle}
  - Job Description: ${jobDescription}
  - Experience Level: ${experience}
  - End Date for Applications: ${endDate}

  Candidates for Consideration:


  Thank you for your attention to this new opportunity. Please ensure that the candidates are reviewed promptly.

  Best regards,
  Padamati Lakshman`,
  };

  return transporter.sendMail(mailOptions);
}
exports.createInterview = async (req, res) => {
  const { jobTitle, jobDescription, endDate, experience, emails, token } =
    req.body;
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  const email = decoded.email;
  const user = await User.findOne({ company_email: email });
  if (!user.mobileVerifed || !user.emailVerified) {
    return res.status(400).json({ error: "verify your email and mobile" });
  }
  const message = { jobTitle, jobDescription, endDate, experience };

  try {
    await sendEmail(emails.join(","), req.body);
    const newJobPosting = new jobPostings(message);
    await newJobPosting.save();
    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(400).json({ status: "failed" });
  }
};
exports.getInterviews = async (req, res) => {
  try {
    const postings = await jobPostings.find({}); // Fetch all postings
    console.log(postings);
    res.status(200).json({ ok: true, postings });
  } catch (err) {
    console.error("Error fetching job postings:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};
