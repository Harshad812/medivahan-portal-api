import { Router } from 'express';
import passport from '../middleware/passport';
import  { doctorDetails, getAllDoctor, getPrescriptionByDoctor, getTotalPaidAndTotalDueByUser, updateCommissionOrDiscount } from '../controllers/doctorController';

const router = Router();

// Protected routes

//Dashboard route
router.get('/doctor/doctor-details/:user_id',  passport.authenticate('jwt', { session: false }),doctorDetails)

router.get(
  '/doctor/all',
  passport.authenticate('jwt', { session: false }),
  getAllDoctor
);

router.get(
  '/doctor/doctor-prescription',
  passport.authenticate('jwt', { session: false }),
  getPrescriptionByDoctor
);

router.get('/doctor/total-paid-and-total-due/:user_id',  passport.authenticate('jwt', { session: false }),getTotalPaidAndTotalDueByUser)

router.put('/doctor/discount-commision-update',updateCommissionOrDiscount)


export default router;
