import express from "express";

import { protectRoute ,validateCoupon } from "../middleware/auth.middleware.js";
import getCoupon from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/",protectRoute,getCoupon);
router.get("/validate",protectRoute,validateCoupon)

export default router;