import { Response } from 'express';
import Notification from '../models/Notification';

export const createNotification = async (
  message: string,
  user_id: number,
  res: Response
) => {
  try {
    // Validate input
    if (!message || !user_id) {
      return res
        .status(400)
        .json({ error: 'Message and user_id are required.' });
    }

    const newNotification = new Notification({
      message,
      user_id,
      read: false,
    });

    // Save the notification to the database
    await newNotification.save();

    // Respond with the created notification
    return res.status(201).json({ notification: newNotification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while creating the notification.' });
  }
};
