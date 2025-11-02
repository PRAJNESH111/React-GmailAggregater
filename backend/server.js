import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import gmailRoutes from "./routes/gmail.js";
import userAuthRoutes from "./routes/userAuth.js";

dotenv.config();
const app = express();
// Trust first proxy so req.protocol / req.get('host') reflect real client when hosted (Render)
app.set("trust proxy", 1);

// CORS with credentials for cookie-based auth
const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps, curl, SSR
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Also allow localhost:5173 in dev if not explicitly listed
      if (
        process.env.NODE_ENV !== "production" &&
        (origin === "http://localhost:5173" ||
          origin === "http://127.0.0.1:5173")
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
// Explicitly handle preflight for all routes
app.options(
  /.*/,
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" &&
        (origin === "http://localhost:5173" ||
          origin === "http://127.0.0.1:5173")
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// MongoDB connection
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/EmailAggrigator";
mongoose
  .connect(mongoUri, { autoIndex: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// user auth endpoints
app.use("/auth", userAuthRoutes);
// google oauth endpoints
app.use("/auth", authRoutes);
app.use("/gmail", gmailRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
