import { Router } from 'express';
import passport from '../middleware/passport';
import { doctorDetails, getAllDoctor, getPrescriptionByDoctor, updateCommissionOrDiscount } from '../controllers/doctorController';

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

router.put('/doctore/discount-commision-update',updateCommissionOrDiscount)


export default router;
