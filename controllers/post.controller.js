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
    const audio = type === ("audio" || "post" || "short") && req.files["audio"] ? req.files["audio"][0] : null;
    const video = type === "short" && req.files["video"][0] ? req.files["video"][0] : null;
    const author = req.userId;

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
          .json({ message: "A video is required for short." });
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
      type === "audio"
        ? audioUrl // Required only for type 'audio'
        : (type === "post" || type === "short") && audioUrl
        ? audioUrl // Optional for 'post' and 'short'
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
    const { page = 1, limit = 5 } = req.query;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit, 10)) // Correct radix
      .limit(parseInt(limit, 10)) // Correct radix
      .populate({ path: "author", select: "username avatar" })
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "username avatar" },
      });

    const totalPosts = await Post.countDocuments();

    return res.status(200).json({
      posts,
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
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
    const likeKarneWala = req.userId; // User liking the post
    const postId = req.params.id; // Post being liked

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(400)
        .json({ message: "Post not found", success: false });
    }

    // Add the user to the likes set
    await post.updateOne({ $addToSet: { likes: likeKarneWala } });
    await post.save();

    // Get user details
    const user = await User.findById(likeKarneWala).select("avatar username");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const postOwnerId = post.author.toString();

    // Avoid creating a notification for self-like
    if (postOwnerId !== likeKarneWala) {
      // Check if a similar notification already exists
      const existingNotification = await Notification.findOne({
        type: "like",
        sender: likeKarneWala,
        receiver: postOwnerId,
        postId: postId,
      });

      if (!existingNotification) {
        // Create a new notification
        const newNotification = await Notification.create({
          type: "like",
          sender: likeKarneWala, // Save sender's ObjectId
          receiver: postOwnerId,
          postId: postId, // Save post's ObjectId
          message: `Liked your ${post?.type}`,
          isRead: false,
        });

        // Populate additional fields
        const populatedNotification = await Notification.findById(
          newNotification._id
        )
          .populate("sender", "avatar username") // Include sender's avatar and username
          .populate("postId", "images audio type video content"); // Include the full post details

        // Emit the notification via socket
        const postOwnerSocketId = getReceiverSocketId(postOwnerId);
        if (postOwnerSocketId) {
          io.to(postOwnerSocketId).emit("notification", populatedNotification);
        }
      }
    }

    return res.status(200).json({ message: "Post liked", success: true });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
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
