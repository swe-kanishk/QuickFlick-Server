// routes/storyRoutes.js
import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getStories, postStories } from '../controllers/story.controller.js';
import { postUpload } from '../middlewares/postUpload.js';

const router = express.Router();

router.route('/').post(isAuthenticated, postUpload.fields([
    { name: 'images', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
]), postStories)

router.route('/:userId').get(isAuthenticated, getStories);

export default router;