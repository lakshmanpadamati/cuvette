const mongoose=require('mongoose');
const otpSchema=new mongoose.Schema({
    email:{type:String},
    emailOTP:{type:String},
    mobile:{type:Number},
    mobileOTP:{type:String}
})
const OTP=new mongoose.model("OTP",otpSchema);
module.exports=OTP;