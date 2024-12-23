import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute=async(req,res,next)=>{
    try {
        const accessToken = req.cookies.accessToken;
        if (accessToken) {
            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.userID).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;

            next();
        }
        else{
            res.status(401).json({ message: "Access token not found in cookies" });
        }
    } catch (error) {
        console.log("Error in protectRoute", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const adminRoute=async(req,res,next)=>{
    try {
        if (req.user && req.user.role === "admin") {
            next();
        } else {
            res.status(401).json({ message: "Access denied : Admin only" });
        }
    } catch (error) {
        console.log("Error in adminRoute", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }}