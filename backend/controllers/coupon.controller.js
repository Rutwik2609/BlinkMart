import Coupon from "../models/coupon.model.js";


export const getCoupon =async(req,res)=>{
    try {
        const coupon = await Coupon.findOne({userId:req.user._id , isActive:true});
        res.json(coupon || null)
    } catch (error) {
        console.log('Error in getCoupon', error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const validateCoupon =async(req,res)=>{
    try {
        const {code} = req.body;
        const coupon = await Coupon.findOne({code});

        if(!coupon){
            return res.status(404).json({ message: "Coupon not found" });
        }

        if(coupon.expirationdate < new Date()){
            coupon.isActive = false;
            await coupon.save();
            return res.status(404).json({ message: "Coupon expired" });
        }

        res.json({message:"Coupon is valid",
            code:coupon.code,
            discount:coupon.discount
        })

        res.json(coupon)
    } catch (error) {
        console.log('Error in validateCoupon', error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}