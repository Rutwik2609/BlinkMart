import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";




import authRoutes  from "./routes/auth.route.js"; //When importing local packages or files you need .js extension
import { connectDB } from "./lib/db.js";
import productRoutes from "./routes/product.route.js";


dotenv.config();

const PORT=process.env.PORT || 8080;

const app = express();

app.use(morgan("dev"));
app.use(express.json());//Built into Express, this middleware parses incoming JSON payloads from the request body and makes them available as req.body.
app.use(cookieParser());//Extracts cookies from the Cookie header and makes them accessible via req.cookies as an object.


app.use("/api/auth",authRoutes);
app.use("/api/products",productRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
  connectDB();
});

// BlinkBazaar – Shopping in the blink of an eye.