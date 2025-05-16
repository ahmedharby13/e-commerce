import mongoose, { Schema, Document } from "mongoose";

export interface BlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
}

const tokenBlacklistSchema: Schema<BlacklistedToken> = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: "0" } }, // Auto-remove after expiration
});

const TokenBlacklist = mongoose.model<BlacklistedToken>(
  "TokenBlacklist",
  tokenBlacklistSchema
);

export default TokenBlacklist;
