import express from "express";
import { login, logout, signup ,refresh_accessToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout )
router.post("/refresh-access-token",refresh_accessToken)

export default router