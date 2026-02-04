import express from 'express';
import {
  getAdminSettings,
  updateAdminSettings
} from '../controllers/adminSettingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;
