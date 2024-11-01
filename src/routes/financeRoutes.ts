import { Router } from 'express';

import { getFinanceData } from '../controllers/finance';
import passport from 'passport';

const router = Router();

router.get(
  '/finance',
  passport.authenticate('jwt', { session: false }),
  getFinanceData
);

export default router;
