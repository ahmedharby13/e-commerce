import mongoose, { Schema, Document, Types } from "mongoose";

export interface User extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  cartData: { [productId: string]: { [size: string]: number } };
  googleId?: string;
  role: "user" | "admin";
  refreshToken?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
}

const userSchema: Schema<User> = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String,
      required: [
        function (this: User) {
          return !this.googleId;
        },
        "Password is required for non-Google users",
      ],
    },
    cartData: {
      type: Object,
      default: {},
    },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshToken: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String }, // Add resetPasswordToken field
  },
  {
    minimize: false,
    timestamps: true,
  }
);

const userModel =
  mongoose.models.User || mongoose.model<User>("User", userSchema);

export default userModel;