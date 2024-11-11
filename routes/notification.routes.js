import express from 'express'
import { deleteNotification, getNotifications, isRead } from '../controllers/notification.controller.js';
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get('/', isAuthenticated, getNotifications);
router.post('/mark-read', isAuthenticated, isRead);
router.post('/:id', isAuthenticated, deleteNotification);

export default router