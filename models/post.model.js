import { model, Schema } from "mongoose";

// Enum for post types
const PostType = ['post', 'blog', 'audio', 'short'];

// Define the schema
const postSchema = new Schema(
  {
    type: {
      type: String,
      enum: PostType,
      required: true,
    },
    caption: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: function () {
        return this.type === 'blog';  // Only required for blog type
      },
      trim: true,
    },
    content: {
      type: String,
      required: function () {
        return this.type === 'blog';  // Only required for blog type
      },
    },
    images: [
      {
        type: String,
        required: function () {
          return this.type === 'post' || this.type === 'short';  // Images only for 'post' and 'short' types
        },
      },
    ],
    video: {
      type: String,
      required: function () {
        return this.type === 'short';  // Video only required for 'short' type
      },
    },
    audio: {
      type: String,
      required: function () {
        return this.type === 'audio' || this.type === 'short';  // Audio required for 'audio' and 'short' types
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Post = model('Post', postSchema);