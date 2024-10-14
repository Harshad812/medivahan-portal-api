import { Router } from 'express';
import passport from '../middleware/passport';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  socialMediaLogin,
  userDetails,
  verifyMobile,
  updateUserDetails,
  deleteAccount,
  ChangePassword,
} from '../controllers/authController';

const router = Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/social-media-login', socialMediaLogin);

// Protected routes
router.get(
  '/user/details',
  passport.authenticate('jwt', { session: false }),
  userDetails
);
router.patch(
  '/user/verifyMobile',
  passport.authenticate('jwt', { session: false }),
  verifyMobile
);
router.patch(
  '/change-password',
  passport.authenticate('jwt', { session: false }),
  ChangePassword
);
router.put(
  '/user/update-details/:id',
  passport.authenticate('jwt', { session: false }),
  updateUserDetails
);
router.delete(
  '/user/delete-account',
  passport.authenticate('jwt', { session: false }),
  deleteAccount
);

export default router;
