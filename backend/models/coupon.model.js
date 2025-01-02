import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code:{
            type:String,
            required:[true,"Code is required"],
            unique:true
        },
        discount:{
            type:Number,
            required:[true,"Discount is required"],
            min:0,
            max:100
        },
        expirationDate:{
            type:Date,
            required:[true,"Expiration date is required"],
        },
        isActive:{
            type:Boolean,
            default:false
        },
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:[true,"User ID is required"],
            unique:true
        }
},
{
    timestamps:true
})

const Coupon = mongoose.model("Coupon",couponSchema);

export default Coupon;