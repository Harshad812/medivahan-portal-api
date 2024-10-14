import { Router } from 'express';
import passport from '../middleware/passport';
import {
  createPrescription,
  getPrescriptionsByFilters,
  prescriptionDetails,
  prescriptionList,
  updatePrescriptionDetails,
} from '../controllers/prescriptionController';

const router = Router();

// Protected routes
router.get(
  '/prescription/details/:id',
  passport.authenticate('jwt', { session: false }),
  prescriptionDetails
);
router.get(
  '/prescription/all',
  passport.authenticate('jwt', { session: false }),
  prescriptionList
);
router.get(
  '/prescription/filter-prescription',
  passport.authenticate('jwt', { session: false }),
  getPrescriptionsByFilters
);
router.post(
  '/prescription/create',
  passport.authenticate('jwt', { session: false }),
  createPrescription
);
router.put(
  '/prescription/update/:id',
  passport.authenticate('jwt', { session: false }),
  updatePrescriptionDetails
);

export default router;
