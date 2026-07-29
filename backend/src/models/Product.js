import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    accessType: {
      type: String,
      enum: ["private_channel", "download", "mixed"],
      default: "private_channel"
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      default: ""
    },
    downloadUrl: {
      type: String,
      default: ""
    },
    fileVersion: {
      type: String,
      default: ""
    },
    fileSizeLabel: {
      type: String,
      default: ""
    },
    highlights: {
      type: [String],
      default: []
    },
    chapterOutline: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ category: 1, isActive: 1 });

export const Product = mongoose.model("Product", productSchema);
