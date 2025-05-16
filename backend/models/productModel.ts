import mongoose, { Schema, Document } from "mongoose";

export interface Product extends Document {
  name: string;
  price: number;
  sizes: string[];
  stock: number;
  category: string;
  subCategory: string;
  description: string;
  images: string[];
  date: Date;
  bestseller: boolean;
  ratings: number;
  reviews: Array<{
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  averageRating: number;
}

const productSchema: Schema<Product> = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    sizes: [{ type: String }],
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    date: { type: Date, default: Date.now },
    bestseller: { type: Boolean, default: false },
    ratings: { type: Number, default: 0 },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productModel =
  mongoose.model<Product>("Product", productSchema) || mongoose.models.Product;

export default productModel;
