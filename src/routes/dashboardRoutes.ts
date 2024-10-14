import { Router } from 'express';
import {
  getPrescriptionAndDoctorCount,
  recentPrescriptions,
  requireDetailsDoctorList,
} from '../controllers/dashboardController';

const router = Router();

router.get('/dashboard/recent-prescriptions', recentPrescriptions);
router.get('/dashboard/require-details-doctor-list', requireDetailsDoctorList);
router.get(
  '/dashboard/get-doctor-and-prescriptions-counts',
  getPrescriptionAndDoctorCount
);

export default router;
