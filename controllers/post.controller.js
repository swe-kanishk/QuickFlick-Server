import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import Notification from "../models/Notification.js";

export const addNewPost = async (req, res) => {
  try {
    const { type, caption, title, content } = req.body;

    const images = type === "post" && req.files["images"];
    const audio = type === "audio" || "post" || "shorts" && req.files["audio"] ? req.files["audio"][0] : null;
    const video =
      type === "shorts" && req.files["video"] ? req.files["video"][0] : null;
    const author = req.userId;

    console.log(images)
    console.log(audio)

    if (!type || !["blog", "post", "audio", "short"].includes(type)) {
      return res.status(400).json({ message: "Invalid post type provided." });
    }

    if (type === "blog") {
      if (!title || !content) {
        return res
          .status(400)
          .json({ message: "Blog posts require a title and content." });
      }
    } else if (type === "audio") {
      if (!audio) {
        return res
          .status(400)
          .json({ message: "Audio is required for audio posts." });
      }
    } else if (type === "post") {
      if (!images || images.length === 0) {
        return res
          .status(400)
          .json({
            message: "At least one image is required for post type.",
          });
      }

      if (images && images.length > 8) {
        return res
          .status(400)
          .json({ message: "You can upload a maximum of 8 images." });
      }
    } else if (type === "short") {
      if (!video) {
        return res
          .status(400)
          .json({ message: "A video is required for shorts." });
      }
    }

    const imageUrls = [];
    if (type === "post" && images && images.length > 0) {
      for (let image of images) {
        const optimizedImageBuffer = await sharp(image.buffer)
          .resize({ width: 800, height: 800, fit: "inside" })
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();

        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
          "base64"
        )}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        imageUrls.push(cloudResponse.secure_url);
      }
    }

    let audioUrl = null;
    if ((type === "post" || type === "audio" || type === "short") && audio) {
      const audioBuffer = `data:${
        audio.mimetype
      };base64,${audio.buffer.toString("base64")}`;
      const cloudResponse = await cloudinary.uploader.upload(audioBuffer, {
        resource_type: "video",
      });
      audioUrl = cloudResponse.secure_url;
    }

    let videoUrl = null;
    if (type === "short" && video) {
      const videoBuffer = `data:${
        video.mimetype
      };base64,${video.buffer.toString("base64")}`;
      const cloudResponse = await cloudinary.uploader.upload(videoBuffer, {
        resource_type: "video",
      });
      videoUrl = cloudResponse.secure_url;
    }

    console.log(imageUrls)
    console.log(videoUrl)
    console.log(audioUrl)
    const post = await Post.create({
      type,
      caption: type === "audio" || type === "short" ? caption : undefined,
      title: type === "blog" && title ? title : undefined,
      content: type === "blog" && content ? content : undefined,
      author,
      images: type === "post" && imageUrls.length > 0 ? imageUrls : [],
      audio:
        (type === "post" || type === "audio" || type === "short") && audioUrl
          ? audioUrl
          : null,
      video: type === "short" && videoUrl ? videoUrl : null,
    });

    const user = await User.findById(author);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "Post added successfully!",
      post,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username avatar" })
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "username avatar" },
      });

    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const authorId = req.userId;
    const userPosts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, avatar" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username, avatar" },
      });
    return res.status(200).json({
      userPosts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const likeKarneWala = req.userId;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(400)
        .json({ message: "Post not found", success: false });

    await post.updateOne({ $addToSet: { likes: likeKarneWala } });
    await post.save();

    const user = await User.findById(likeKarneWala).select("avatar username");
    const postOwnerId = post.author.toString();

    if (postOwnerId !== likeKarneWala) {
      const existingNotification = await Notification.findOne({
        type: "like",
        sender: likeKarneWala,
        receiver: postOwnerId,
        postId: postId,
      });

      if (!existingNotification) {
        const newNotification = await Notification.create({
          type: "like",
          sender: user,
          receiver: postOwnerId,
          postId: postId,
          message: `Liked your post`,
          isRead: false,
        });
        newNotification.postId = post;
        const postOwnerSocketId = getReceiverSocketId(postOwnerId);
        io.to(postOwnerSocketId).emit("notification", newNotification);
      }
    }
    return res.status(200).json({ message: "Post liked", success: true });
  } catch (error) {
    console.log(error);
  }
};

export const dislikePost = async (req, res) => {
  try {
    const dislikeKarneWala = req.userId;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(400)
        .json({ message: "Post not found", success: false });

    await post.updateOne({ $pull: { likes: dislikeKarneWala } });
    await post.save();

    const user = await User.findById(dislikeKarneWala).select(
      "avatar username"
    );
    const postOwnerId = post.author.toString();

    if (postOwnerId !== dislikeKarneWala) {
      await Notification.findOneAndDelete({
        type: "like",
        sender: dislikeKarneWala,
        receiver: postOwnerId,
        postId: postId,
      });
    }

    return res.status(200).json({ message: "Post disliked", success: true });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const commentKarneWala = req.userId;
    const postId = req.params.id;
    const { text } = req.body;
    const post = await Post.findById(postId);

    if (!text)
      return res
        .status(400)
        .json({ message: "text is required", success: false });

    let comment = await Comment.create({
      text,
      author: commentKarneWala,
      post: postId,
    });

    comment = await comment.populate({
      path: "author",
      select: "username avatar",
    });

    post.comments.push(comment._id);
    await post.save();

    const user = await User.findById(commentKarneWala).select(
      "avatar username"
    );
    const postOwnerId = post.author.toString();

    if (postOwnerId !== commentKarneWala) {
      const existingNotification = await Notification.findOne({
        type: "comment",
        sender: commentKarneWala,
        receiver: postOwnerId,
        postId: postId,
      });

      if (!existingNotification) {
        const notification = await Notification.create({
          type: "comment",
          sender: user,
          receiver: postOwnerId,
          postId,
          message: `commented on your post`,
        });
        const postOwnerSocketId = getReceiverSocketId(postOwnerId);
        io.to(postOwnerSocketId).emit("notification", notification);
      }
    }

    return res.status(200).json({
      message: "comment added successfully!",
      success: true,
      comment,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username, avatar"
    );
    if (!comments)
      return res.status(404).json({
        message: "No comments found for this post",
        success: false,
      });
    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.userId;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({
        message: "Post not found!",
        success: false,
      });

    if (post.author.toString() !== authorId)
      return res.status(403).json({
        message: "You are an unauthorized user",
        success: false,
      });
    await Post.findByIdAndDelete(postId);
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    await Comment.deleteMany({ post: postId });
    return res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const savedPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.userId;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    const user = await User.findById(authorId);
    if (user.saved.includes(post._id)) {
      await user.updateOne({ $pull: { saved: post._id } });
      await user.save();
      return res.status(200).json({
        message: "post remove from saved successfully!",
        success: true,
        type: "unsaved",
      });
    } else {
      await user.updateOne({ $addToSet: { saved: post._id } });
      await user.save();
      return res.status(200).json({
        message: "post saved successfully!",
        success: true,
        type: "saved",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
