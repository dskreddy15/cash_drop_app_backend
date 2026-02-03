import express from 'express';
import {
  createCashDrawer,
  getCashDrawers,
  deleteCashDrawer
} from '../controllers/cashDrawerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createCashDrawer);
router.get('/', getCashDrawers);
router.delete('/:id', deleteCashDrawer);

export default router;
