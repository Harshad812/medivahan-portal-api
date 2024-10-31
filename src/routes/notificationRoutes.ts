// routes/notificationRoutes.ts
import { Router } from 'express';
import {
  createNotification,
  getAllNotifications,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getRecentlyNotifications,
} from '../controllers/notificationController';
import passport from 'passport';

const router = Router();

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createNotification
);

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getAllNotifications
);
router.get(
  '/recent',
  passport.authenticate('jwt', { session: false }),
  getRecentlyNotifications
);

router.patch(
  '/:id/read',
  passport.authenticate('jwt', { session: false }),
  markNotificationAsRead
);
router.get(
  '/:user_id',
  passport.authenticate('jwt', { session: false }),
  getNotifications
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  deleteNotification
);

export default router;
