import { Router } from 'express';
import passport from '../middleware/passport';
import {
  clinicDetails,
  createClinic,
  updateClinicDetails,
  verifyAssistantMobile,
} from '../controllers/clinicController';

const router = Router();

// Protected routes
router.get(
  '/clinic/details/:id',
  passport.authenticate('jwt', { session: false }),
  clinicDetails
);
router.post(
  '/clinic/create',
  passport.authenticate('jwt', { session: false }),
  createClinic
);
router.patch(
  '/clinic/verify-assistant-mobile/:id',
  passport.authenticate('jwt', { session: false }),
  verifyAssistantMobile
);
router.put(
  '/clinic/update/:id',
  passport.authenticate('jwt', { session: false }),
  updateClinicDetails
);

export default router;
