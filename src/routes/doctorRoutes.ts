import { Router } from 'express';
import passport from '../middleware/passport';
import { getAllDoctor } from '../controllers/doctorController';

const router = Router();

// Protected routes

//Dashboard route
router.get(
  '/doctor/all',
  passport.authenticate('jwt', { session: false }),
  getAllDoctor
);

export default router;
