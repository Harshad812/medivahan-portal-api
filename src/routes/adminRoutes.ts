import { Router } from 'express';

import { AdminLogin, AdminRegister } from '../controllers/adminController';

const router = Router();

router.post('/admin-register', AdminRegister);
router.post('/admin-login', AdminLogin);

export default router;
