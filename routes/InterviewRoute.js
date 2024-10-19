const express=require("express");
const router=express.Router();
const {createInterview, getInterviews}=require("./../controllers/Interview")
router.route("/").post(createInterview).get(getInterviews)
module.exports=router
