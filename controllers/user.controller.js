import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

import crypto from "crypto";

import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/sendEmails.js";

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!email || !username || !email) {
      throw new Error("All fields are required!");
    }

    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      username,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000,
    });

    await user.save();

    // jwt
    generateTokenAndSetCookie(res, user._id);
    // sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { ...user._doc, password: null },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  const { userId } = req;

  try {
    // Generate a new verification token and set the expiry time
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000; // Expires in 5 minutes

    // Find the user by ID and update the verification token and expiry time
    const user = await User.findByIdAndUpdate(
      userId,
      { verificationToken, verificationTokenExpiresAt },
      { new: true }
    ).select(
      "-password -resetPasswordToken -resetPasswordExpiresAt -verificationToken -verificationTokenExpiresAt"
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      message: "OTP has been resent successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res
      .status(500)
      .json({ message: "Failed to resend OTP", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  console.log(code);
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }
    (user.isVerified = true),
      (user.verificationToken = undefined),
      (user.verificationTokenExpiresAt = undefined),
      await user.save();
    // await sendWelcomeEmail(user.email, user.username);
    return res.status(201).json({
      success: true,
      message: "Email verified successfully",
      user: { ...user._doc, password: null },
    });
  } catch (error) {
    console.log("error in verifyEmail", error);
    return res.status(500).json({
      success: false,
      message: "server error!",
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("quickFlick-token");
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const user = await User.findOne({ email }).populate({
      path: "following", // Populate the 'following' field
      select: "username avatar bio stories", // Include only specific fields
      populate: {
        path: "stories", // Nested populate for 'stories'
        select: "title content createdAt", // Replace with story fields you need
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect email or password!" });
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: null,
      },
    });
  } catch (error) {
    console.log("Error in login", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    const resetToken = crypto.randomBytes(10).toString("hex");
    const resetTokenExpiresAt = Date.now() + 5 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;
    await user.save();

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    );
    return res
      .status(200)
      .json({
        success: true,
        message: "Password reset link, sent to your email successfully",
      });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  console.log(token, password);
  if (!token || !password) {
    return res
      .status(400)
      .json({ success: false, message: "password or token is missing" });
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const updatePassword = await bcrypt.hash(password, 10);

    user.password = updatePassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    // sending success email
    await sendPasswordResetSuccessEmail(user.email);
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log(`Error in resetPassword`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate({
        path: "following", // Populate the 'following' field
        select: "username avatar bio stories", // Include only specific fields
        populate: {
          path: "stories", // Nested populate for 'stories'
          select: "title content createdAt", // Replace with story fields you need
        },
      });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    console.log("yse success hua", user);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId)
      .select("-password")
      .populate({ path: "posts", createdAt: -1 })
      .populate("saved")
      .populate({
        path: "follower",
        select: "avatar username", // Only include avatar and username for followers
      })
      .populate({
        path: "following",
        select: "avatar username", // Only include avatar and username for following
      });
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { bio, gender } = req.body;
    const avatar = req.file;

    console.log(avatar)
    let cloudResponse;
    if (avatar) {
      const fileUri = getDataUri(avatar);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found!",
        success: false,
      });
    }
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (avatar) user.avatar = cloudResponse.secure_url;

    await user.save();

    user.password = undefined;
    return res.status(200).json({
      message: "Profile updated successfully!",
      success: true,
      user,
    });
  } catch (err) {
    console.log(err);
  }
};

export const suggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.userId } }).select(
      "-password"
    );
    if (!suggestedUsers) {
      return res.status(400).json({
        message: "Currently do not have any users!",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (err) {
    console.log(err);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followKrneWala = req.userId;
    const jiskoFollowKrunga = req.params.id;
    if (followKrneWala === jiskoFollowKrunga) {
      return res.status(400).json({
        message: `You can't follow/unfollow yourself!`,
        success: false,
      });
    }
    const user = await User.findById(followKrneWala);
    const targetUser = await User.findById(jiskoFollowKrunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found!",
        success: false,
      });
    }

    const isFollowing = user.following.includes(jiskoFollowKrunga);
    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $pull: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $pull: { follower: followKrneWala } }
        ),
      ]);
      const updatedUser = await User.findById(followKrneWala)
        .populate("following", "avatar username stories posts") // Populate necessary fields for following
        .populate("follower", "avatar username stories posts");

      return res.status(200).json({
        message: "unfollow successfully",
        success: true,
        isFollowing: false,
        user: updatedUser,
      });
    } else {
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $push: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $push: { follower: followKrneWala } }
        ),
      ]);

      const updatedUser = await User.findById(followKrneWala)
        .populate("following", "avatar username stories posts") // Populate necessary fields for following
        .populate("follower", "avatar username stories posts");

      return res.status(200).json({
        message: "followed successfully",
        success: true,
        isFollowing: true,
        user: updatedUser,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const updateTheme = async (req, res) => {
  console.log(req);
  const { userId } = req;
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found!",
      });
    }

    // Toggle the isDark field
    user.isDark = !user.isDark;

    // Save the updated user document
    await user.save();

    // Return the updated isDark status
    return res.status(200).json({
      success: true,
      isDark: user.isDark,
      message: `Theme updated to ${user.isDark ? "dark" : "light"}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
