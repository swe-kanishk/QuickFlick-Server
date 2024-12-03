import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.userId })
      .populate('sender', 'username avatar')
      .populate('postId', 'images content audio type video')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const isRead = async (req, res) => {
    try {
      const { notificationIds } = req.body; // Array of notification IDs to mark as read
  
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Notification IDs are required' });
      }
  
      // Update all notifications in bulk that match the IDs and receiver
      const updatedNotifications = await Notification.updateMany(
        { _id: { $in: notificationIds }, receiver: req.userId, isRead: false },
        { isRead: true }
      );
  
      if (updatedNotifications.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'No unread notifications found' });
      }
  
      res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Route to delete a notification
export const deleteNotification =  async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiver: req.userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};