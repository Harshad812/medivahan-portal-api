import { Router } from 'express';
import passport from '../middleware/passport';
import {
  createBillAndUpdatePrescription,
  createPrescription,
  getAllPrescription,
  getPrescriptionsByFilters,
  getPrescriptionStatusCount,
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

router.get(
  '/dashboard/all-prescription-count',
  passport.authenticate('jwt', { session: false }),
  getPrescriptionStatusCount
);

router.put(
  '/dashboard/prescriptions/update-status',
  passport.authenticate('jwt', { session: false }),
  updatePrescriptionStatus
);

router.put(
  '/dashboard/prescriptions/:prescription_id',
  passport.authenticate('jwt', { session: false }),
  createBillAndUpdatePrescription
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
