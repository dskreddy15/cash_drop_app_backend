import { CashDropReconciler } from '../models/cashDropReconcilerModel.js';
import { CashDrop } from '../models/cashDropModel.js';

export const getCashDropReconcilers = async (req, res) => {
  try {
    const { datefrom, dateto } = req.query;
    
    if (!datefrom || !dateto) {
      return res.status(400).json({ error: 'Both datefrom and dateto are required' });
    }
    
    const userId = req.user.is_admin ? null : req.user.id;
    const reconcilers = await CashDropReconciler.findByDateRange(datefrom, dateto, userId);
    
    // Add full URL for label images
    const reconcilersWithImageUrl = reconcilers.map(reconciler => {
      const result = { ...reconciler };
      
      if (reconciler.label_image) {
        const baseUrl = req.protocol + '://' + req.get('host');
        result.label_image_url = `${baseUrl}${reconciler.label_image}`;
      }
      
      return result;
    });
    
    res.json(reconcilersWithImageUrl);
  } catch (error) {
    console.error('Get cash drop reconcilers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCashDropReconciler = async (req, res) => {
  try {
    const { id } = req.body;
    const { admin_count_amount } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    
    const reconciler = await CashDropReconciler.findById(id);
    
    if (!reconciler) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Get the drop entry to compare amounts
    const dropEntry = await CashDrop.findById(reconciler.drop_entry_id);
    
    if (!dropEntry) {
      return res.status(404).json({ error: 'Associated cash drop not found' });
    }
    
    const adminCounted = parseFloat(admin_count_amount || 0);
    const systemDrop = parseFloat(dropEntry.drop_amount);
    
    // Strict validation: amounts must match exactly
    if (adminCounted !== systemDrop) {
      return res.status(400).json({
        error: `Reconciliation Failed. Counted amount ($${adminCounted}) does not match System Drop amount ($${systemDrop}).`
      });
    }
    
    // Update the reconciler
    const updated = await CashDropReconciler.update(id, {
      admin_count_amount: adminCounted,
      is_reconciled: true
    });
    
    // Add image URL if present
    if (updated && updated.label_image) {
      const baseUrl = req.protocol + '://' + req.get('host');
      updated.label_image_url = `${baseUrl}${updated.label_image}`;
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Update cash drop reconciler error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createCashDropReconciler = async (req, res) => {
  try {
    const data = {
      user_id: req.user.id,
      drop_entry_id: req.body.drop_entry_id,
      workstation: req.body.workstation,
      shift_number: req.body.shift_number,
      date: req.body.date
    };
    
    const reconciler = await CashDropReconciler.create(data);
    res.status(201).json(reconciler);
  } catch (error) {
    console.error('Create cash drop reconciler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
