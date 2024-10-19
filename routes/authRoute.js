const express=require('express');
const {signup,verifyOTP, checkAuth,signin}=require("../controllers/authController")
const router=express.Router();
router.route("/signup").post(signup)
router.route("/verify").post(verifyOTP)
router.route("/signin").post(signin)

router.route("/checkAuth").get(checkAuth)
module.exports=router;