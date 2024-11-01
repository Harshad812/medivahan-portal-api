import { Router } from 'express';

import {
  AdminDetails,
  AdminLogin,
  AdminRegister,
  ChangePassword,
  resetPassword,
  sendOtp,
  verifyOtp,
} from '../controllers/adminController';
import passport from 'passport';

const router = Router();

router.get(
  '/admin-details',
  passport.authenticate('jwt', { session: false }),
  AdminDetails
);

router.post('/admin-register', AdminRegister);
router.post('/admin-login', AdminLogin);
router.post('/admin-send-otp', sendOtp);
router.post('/admin-verify-otp', verifyOtp);
router.post('/admin-reset-password', resetPassword);
router.post(
  '/admin-change-password',
  passport.authenticate('jwt', { session: false }),
  ChangePassword
);

export default router;
