// models/Story.js
import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
    },
    image: [
      {
        type: String,
        required: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiryTime: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiration
    },
  },
  { timestamps: true }
);

export const Story = mongoose.model("Story", storySchema);