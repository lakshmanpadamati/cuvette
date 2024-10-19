const mongoose=require('mongoose');
const UserSchema=new mongoose.Schema({
    name:{type:String,require:true},
    company_email:{type:String,required:true,unique:true},
    company_name:{type:String,required:true,unique:true},
    mobile:{type:Number,required:true},
    employees:{type:Number,required:true,min:1},
    mobileVerifed:{type:Boolean,default:false},
    emailVerified:{type:Boolean,default :false},
    created_at:{type:Date,default:Date.now()},
    hashedPassword:{type:String,required:true}

})
const user=mongoose.model("User",UserSchema);
module.exports=user;
