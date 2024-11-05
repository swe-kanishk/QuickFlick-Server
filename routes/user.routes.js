import express from "express";
import { checkAuth, editProfile, followOrUnfollow, forgotPassword, getProfile, login, logout, register, resendOTP, resetPassword, suggestedUsers, verifyEmail } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/check-auth", isAuthenticated, checkAuth);

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').post(logout)

router.route('/verify-email').post(verifyEmail);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

router.route('/:id/profile').get(isAuthenticated, getProfile)
router.route('/profile/edit').post(isAuthenticated, upload.single('avatar'), editProfile);
router.route('/suggested').get(isAuthenticated, suggestedUsers);
router.route('/followorunfollow').post(isAuthenticated, followOrUnfollow);

router.route('/resend-otp').get(isAuthenticated, resendOTP)
export default router;