import mongoose, { Schema, Document } from "mongoose";

export interface Order extends Document {
  userId: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: "COD" | "Stripe";
  payment: boolean;
  status: "Order Placed" | "Pending" | "Shipped" | "Delivered" | "Cancelled";
  date: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema: Schema<Order> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        size: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    address: {
      type: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
      },
      required: true,
    },
    paymentMethod: { type: String, enum: ["COD", "Stripe"], required: true },
    payment: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Order Placed", "Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Order Placed",
    },
    date: { type: Number, default: Date.now },
  },
  { timestamps: true }
);

const orderModel =
  mongoose.model<Order>("Order", orderSchema) || mongoose.models.Order;

export default orderModel;
