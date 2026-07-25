import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

export const notificationController = {
  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await Notification.find({ user: req.user!._id })
        .sort('-createdAt')
        .limit(50)
        .lean();
      
      const unreadCount = notifications.filter(n => !n.read).length;

      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await Notification.findOneAndUpdate(
        { _id: id, user: req.user!._id },
        { read: true },
        { new: true }
      );
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }
      res.json({ success: true, data: { notification } });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await Notification.updateMany(
        { user: req.user!._id, read: false },
        { read: true }
      );
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },

  // Admin Endpoints

  async getAdminNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await Notification.find({ isAdminNotification: true })
        .sort('-createdAt')
        .limit(50)
        .lean();
      
      const unreadCount = notifications.filter(n => !n.read).length;

      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
      next(err);
    }
  },

  async markAdminAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await Notification.findOneAndUpdate(
        { _id: id, isAdminNotification: true },
        { read: true },
        { new: true }
      );
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }
      res.json({ success: true, data: { notification } });
    } catch (err) {
      next(err);
    }
  },

  async markAllAdminAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await Notification.updateMany(
        { isAdminNotification: true, read: false },
        { read: true }
      );
      res.json({ success: true, message: 'All admin notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },
};
