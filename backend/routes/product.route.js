import express from "express";

import  { getAllProducts , getFeaturedProducts , createProduct , deleteProduct ,getRecommendedProducts ,getProductsByCategory ,toggleFeatured} from "../controllers/product.controller.js";
import { adminRoute, protectRoute  } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",protectRoute,adminRoute,getAllProducts);
router.get("/featured",getFeaturedProducts);
router.get("/recommendations",getRecommendedProducts);
router.get("/category/:category",getProductsByCategory);
router.post("/",protectRoute,adminRoute,createProduct);
router.post("/:id",protectRoute,adminRoute,deleteProduct);
router.patch("/:id",protectRoute,adminRoute,toggleFeatured);

export  default router ;