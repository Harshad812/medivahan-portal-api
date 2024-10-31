import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/user';

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

export const createNotification = async (req: Request, res: Response) => {
  const { message, user_id } = req.body;

  try {
    const newNotification = await Notification.create({
      user_id,
      read: false,
      message,
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error creating notification',
      error: error.message,
    });
  }
};

export const getAllNotifications = async (req: Request, res: Response) => {
  const limit = req.query.limit
    ? parseInt(req.query.limit as string)
    : undefined;

  try {
    const notifications = await Notification.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'profileImage'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...(limit !== undefined && { limit }),
    });

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message,
    });
  }
};

export const getRecentlyNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'profileImage'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message,
    });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  const user_id = parseInt(req.params.user_id, 10);

  try {
    const notifications = await Notification.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'profileImage'],
        },
      ],
      where: { user_id },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const notificationId = parseInt(req.params.id, 10);

  try {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true; // Mark as read
    await notification.save();

    res
      .status(200)
      .json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const notificationId = parseInt(req.params.id, 10);

  try {
    const deletedRows = await Notification.destroy({
      where: { notification_id: notificationId },
    });
    if (!deletedRows) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

// unread notifications count
// export const getUnreadNotificationsCount = async (
//   req: Request,
//   res: Response
// ) => {
//   const user_id = parseInt(req.params.user_id, 10);

//   try {
//     const notifications = await Notification.findAll({
//       where: { user_id, read: false },
//     });
//     res.status(200).json({
//       message: 'Notifications retrieved successfully',
//       notifications,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       message: 'Error retrieving notifications',
//       error: error.message,
//     });
//   }
// };

// export const getAllUnreadNotificationsCount = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const notifications = await Notification.findAll({});

//     res.status(200).json({
//       message: 'Notifications retrieved successfully',
//       notifications,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       message: 'Error retrieving notifications123',
//       error: error.message,
//     });
//   }
// };
