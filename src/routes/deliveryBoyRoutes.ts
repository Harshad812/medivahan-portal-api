import { Router } from 'express';
import {
  createDeliveryBoy,
  deliveryBoyDetails,
  deliveryBoyList,
  updateDeliveryBoy,
} from '../controllers/deliveryBoyController';
import passport from 'passport';

const router = Router();

router.get(
  '/delivery-boy/all',
  passport.authenticate('jwt', { session: false }),
  deliveryBoyList
);

router.get(
  '/delivery-boy/:id',
  passport.authenticate('jwt', { session: false }),
  deliveryBoyDetails
);

router.post(
  '/delivery-boy',
  passport.authenticate('jwt', { session: false }),
  createDeliveryBoy
);

router.patch(
  '/delivery-boy/:id',
  passport.authenticate('jwt', { session: false }),
  updateDeliveryBoy
);

export default router;
