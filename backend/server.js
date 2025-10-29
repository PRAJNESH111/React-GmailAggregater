import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import gmailRoutes from "./routes/gmail.js";

dotenv.config();
const app = express();
// Trust first proxy so req.protocol / req.get('host') reflect real client when hosted (Render)
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/gmail", gmailRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
