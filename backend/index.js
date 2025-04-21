// packages
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Utiles
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { ObjectId } from "mongodb";
import User from "./models/userModel.js";
import cors from "cors";

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

// const run = async () => {
//   await connectDB();

//   const user = await User.findById("67fcfcf78089888f814384c3");
//   console.log(user);
// };
// run();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://ecommerce-pearl-eight.vercel.app",
];

// Serve static files with correct MIME types
// const __dirname = path.resolve();
// app.use(
//   "/uploads",
//   (req, res, next) => {
//     const filePath = path.join(__dirname, "/uploads", req.path);
//     const mimeType = {
//       ".jpg": "image/jpeg",
//       ".jpeg": "image/jpeg",
//       ".png": "image/png",
//       ".gif": "image/gif",
//     }[path.extname(filePath).toLowerCase()];

//     if (mimeType) {
//       res.setHeader("Content-Type", mimeType);
//     }
//     next();
//   },
//   express.static(path.join(__dirname, "/uploads"))
// );

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname + "public/uploads")));

app.listen(port, () => console.log(`Server running on port: ${port}`));
