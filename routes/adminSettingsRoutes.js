import express from 'express';
import {
  getAdminSettings,
  updateAdminSettings
} from '../controllers/adminSettingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET endpoint - accessible to all authenticated users (needed for dropdowns)
router.get('/', authenticateToken, getAdminSettings);

// PUT endpoint - requires admin access
router.put('/', authenticateToken, requireAdmin, updateAdminSettings);

export default router;
