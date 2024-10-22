import { Router } from 'express';
import passport from '../middleware/passport';
import {
  createPrescription,
  getAllPrescription,
  getPrescriptionsByFilters,
  prescriptionDetails,
  prescriptionList,
  updatePrescriptionDetails,
  updatePrescriptionStatus,
} from '../controllers/prescriptionController';

const router = Router();

// Protected routes

//Dashboard route
router.get(
  '/dashboard/prescription/all',
  passport.authenticate('jwt', { session: false }),
  getAllPrescription
);

router.put(
  '/dashboard/prescriptions/update-status',
  passport.authenticate('jwt', { session: false }),
  updatePrescriptionStatus
);

//App route
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
