import mongoose from "mongoose";

const GoogleAccountSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    email: { type: String },
    name: { type: String },
    picture: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    scope: { type: String },
    tokenType: { type: String },
    expiryDate: { type: Date },
  },
  { _id: false }
);

const AppUserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    name: { type: String },
    passwordHash: { type: String, required: true },
    connectedAccounts: { type: [GoogleAccountSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.AppUser ||
  mongoose.model("AppUser", AppUserSchema);
