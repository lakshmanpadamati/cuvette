const User = require("./../models/user");
const dotenv = require("dotenv").config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const OTP = require("../models/otp");
const crypto = require("crypto");
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const SECRET_KEY = process.env.SECRET_KEY;

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.emailPass,
  },
});
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.email,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. Please do not share this code with anyone.`,
  };

  return transporter.sendMail(mailOptions);
}
async function sendOTPSMS(mobile, otp) {
  return client.messages.create({
    body: `Your OTP code is ${otp}. Please do not share this code with anyone.`,
    from: "+13057832976",
    to: mobile,
  });
}
const hashPassword = (password) => {
  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(String(password))
    .digest("hex");
  return hash;
};
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ company_email: email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const hashedPassword = await hashPassword(password);

  if (user.hashedPassword === hashedPassword) {
    const token = jwt.sign({ email }, SECRET_KEY);
    return res.status(200).json({ ok: true, token: token });
  }
  return res.status(401).json({ error: "Invalid user" });
};
exports.signup = async (req, res) => {
  const { name, mobile, email, company, employees, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await User.findOne({ company_email: email });
  if (user && !user.emailVerified) {
    await User.deleteOne({ company_email: email });
  }
  const newUser = new User({
    name,
    company_name: company,
    company_email: email,
    mobile,
    employees,
    hashedPassword,
  });

  try {
    const user = await newUser.save();
    const mobileOTP = generateOTP();
    const emailOTP = generateOTP();

    const hashedMobileOTP = await hashPassword(String(mobileOTP)); // Hashing OTP
    const hashedEmailOTP = await hashPassword(String(emailOTP)); // Hashing OTP

    const newOTPS = new OTP({
      email: user.company_email,
      mobile: user.mobile,
      emailOTP: hashedEmailOTP,
      mobileOTP: hashedMobileOTP,
    });

    await newOTPS.save();
    const results = await Promise.allSettled([
      sendOTPEmail(user.company_email, emailOTP),
      sendOTPSMS("+91" + user.mobile, mobileOTP),
    ]);

    const emailResult = results[0];
    const mobileResult = results[1];

    if (
      emailResult.status === "rejected" &&
      mobileResult.status === "rejected"
    ) {
      await User.deleteOne({ company_email: newUser.company_email });
      return res
        .status(500)
        .json({ error: "Unable to send OTP to email and mobile." });
    } else if (emailResult.status === "rejected") {
      await User.deleteOne({ company_email: newUser.company_email });
      return res.status(500).json({ error: "Unable to send OTP to email." });
    } else if (mobileResult.status === "rejected") {
      await User.deleteOne({ company_email: newUser.company_email });
      return res.status(500).json({ error: "Unable to send OTP to mobile." });
    }

    const token = jwt.sign({ email: newUser.company_email }, SECRET_KEY);
    return res.status(200).json({ ok: true, token });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  let { email, mobile, otp, token } = req.body;

  const decodedToken = verifyToken(token, SECRET_KEY, res);
  if (!decodedToken) return; // If token is invalid, exit the function.

  try {
    if (mobile) {
      const doc = await OTP.findOne({ mobile }, { sort: { createdAt: -1 } });
      const hashedOTP = await hashPassword(otp); // Hashing the received OTP for comparison

      if (doc && doc.mobileOTP === hashedOTP) {
        await User.updateOne({ mobile }, { mobileVerified: true });
        const user = await User.findOne({ mobile });

        if (user && user.mobileVerified && user.emailVerified) {
          await OTP.deleteMany({ mobile });
        }

        return res.status(200).json({ ok: true });
      }
      return res.status(401).json({ error: "Invalid OTP" });
    } else {
      const doc = await OTP.findOne({ email }, { sort: { createdAt: -1 } });
      const hashedOTP = await hashPassword(String(otp)); // Hashing the received OTP for comparison

      if (doc && doc.emailOTP === hashedOTP) {
        await User.updateOne({ email }, { emailVerified: true });
        const user = await User.findOne({ email });

        if (user && user.mobileVerified && user.emailVerified) {
          await OTP.deleteMany({ email });
        }

        return res.status(200).json({ ok: true });
      }
      return res.status(401).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};
const verifyToken = async (token, secretKey, res) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    const { email } = decoded;
    const user = await User.findOne({ company_email: email });
    
    if (!user?.emailVerified) {
      await user.deleteOne({ company_email: email });
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
    return null;
  }
};

exports.checkAuth = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  const user = verifyToken(token, SECRET_KEY, res);
  if (!user) return;
  try {
    const email = user.email;
    const foundUser = await User.findOne({ company_email: email });
    if (!foundUser) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }
    return res.status(200).json({ ok: true, user: foundUser });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
