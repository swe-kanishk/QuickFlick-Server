// routes/storyRoutes.js
import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getStories, postStories } from '../controllers/story.controller.js';
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/').post(isAuthenticated, upload.single('image'), postStories);

router.route('/:userId').get(isAuthenticated, getStories);

export default router;