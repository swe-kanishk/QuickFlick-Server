import express from "express";
import { checkAuth, editProfile, followOrUnfollow, forgotPassword, getProfile, login, logout, register, resendOTP, resetPassword, suggestedUsers, updateTheme, verifyEmail } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { postUpload } from "../middlewares/postUpload.js";

const router = express.Router();

router.get("/check-auth", isAuthenticated, checkAuth);

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').post(logout)

router.route('/update-theme').get(isAuthenticated, updateTheme)

router.route('/verify-email').post(verifyEmail);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

router.route('/:id/profile').get(isAuthenticated, getProfile)
router.route('/profile/edit').post(isAuthenticated, postUpload.fields([
    { name: 'images', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
]), editProfile);
router.route('/suggested').get(isAuthenticated, suggestedUsers);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);

router.route('/resend-otp').get(isAuthenticated, resendOTP)
export default router;