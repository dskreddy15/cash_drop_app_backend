import { CashDrop } from '../models/cashDropModel.js';
import { CashDropReconciler } from '../models/cashDropReconcilerModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getPSTDateTime } from '../utils/dateUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createCashDrop = async (req, res) => {
  try {
    // Determine status: 'drafted' if explicitly set, otherwise 'submitted'
    const status = req.body.status || 'submitted';
    
    // Check if a draft already exists for this workstation/shift/date
    if (status === 'drafted') {
      const existingDraft = await CashDrop.findByWorkstationShiftDateStatus(
        req.body.workstation,
        req.body.shift_number,
        req.body.date,
        'drafted'
      );
      
      if (existingDraft) {
        // Update existing draft
        let labelImagePath = existingDraft.label_image;
        
        // Handle file upload if present
        if (req.file) {
          const fileExtension = path.extname(req.file.originalname);
          const fileName = `cash_drop_${Date.now()}${fileExtension}`;
          const uploadPath = path.join(__dirname, '..', 'media', 'cash_drop_labels', fileName);
          
          fs.writeFileSync(uploadPath, req.file.buffer);
          labelImagePath = `/media/cash_drop_labels/${fileName}`;
        }
        
        const updatedDraft = await CashDrop.update(existingDraft.id, {
          user_id: req.user.id,
          drawer_entry_id: req.body.drawer_entry || req.body.drawer_entry_id || existingDraft.drawer_entry_id,
          drop_amount: req.body.drop_amount,
          hundreds: req.body.hundreds || 0,
          fifties: req.body.fifties || 0,
          twenties: req.body.twenties || 0,
          tens: req.body.tens || 0,
          fives: req.body.fives || 0,
          twos: req.body.twos || 0,
          ones: req.body.ones || 0,
          half_dollars: req.body.half_dollars || req.body.halfDollars || 0,
          quarters: req.body.quarters || 0,
          dimes: req.body.dimes || 0,
          nickels: req.body.nickels || 0,
          pennies: req.body.pennies || 0,
          ws_label_amount: req.body.ws_label_amount || 0,
          variance: req.body.variance || 0,
          label_image: labelImagePath,
          notes: req.body.notes || null,
          status: 'drafted'
        });
        return res.status(200).json(updatedDraft);
      }
    }
    
    // Check if a non-ignored cash drop already exists for this workstation, shift, and date
    // Only prevent duplicates if there's an active (non-ignored) cash drop
    const existingDrop = await CashDrop.findByWorkstationShiftDate(
      req.body.workstation,
      req.body.shift_number,
      req.body.date
    );

    // If a non-ignored cash drop exists, return error
    if (existingDrop && !existingDrop.ignored && status !== 'drafted') {
      return res.status(400).json({ error: 'Cash drop entry already exists for this workstation, shift, and date' });
    }

    let labelImagePath = null;
    
    // Handle file upload if present
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `cash_drop_${Date.now()}${fileExtension}`;
      const uploadPath = path.join(__dirname, '..', 'media', 'cash_drop_labels', fileName);
      
      fs.writeFileSync(uploadPath, req.file.buffer);
      labelImagePath = `/media/cash_drop_labels/${fileName}`;
    }
    
    // Always create a new cash drop entry
    // This allows multiple cash drops for the same workstation/shift/date when one is ignored
    
    const data = {
      user_id: req.user.id,
      drawer_entry_id: req.body.drawer_entry || req.body.drawer_entry_id || null,
      workstation: req.body.workstation,
      shift_number: req.body.shift_number,
      date: req.body.date,
      drop_amount: req.body.drop_amount,
      hundreds: req.body.hundreds || 0,
      fifties: req.body.fifties || 0,
      twenties: req.body.twenties || 0,
      tens: req.body.tens || 0,
      fives: req.body.fives || 0,
      twos: req.body.twos || 0,
      ones: req.body.ones || 0,
      half_dollars: req.body.half_dollars || req.body.halfDollars || 0,
      quarters: req.body.quarters || 0,
      dimes: req.body.dimes || 0,
      nickels: req.body.nickels || 0,
      pennies: req.body.pennies || 0,
      ws_label_amount: req.body.ws_label_amount || 0,
      variance: req.body.variance || 0,
      label_image: labelImagePath,
      notes: req.body.notes || null,
      submitted_at: status === 'submitted' ? getPSTDateTime() : null,
      status: status
    };
    
    const drop = await CashDrop.create(data);
    
    // Auto-create reconciler entry only for submitted cash drops (not drafts)
    if (drop && drop.status === 'submitted' && !drop.ignored) {
      try {
        await CashDropReconciler.create({
          user_id: drop.user_id,
          drop_entry_id: drop.id,
          workstation: drop.workstation,
          shift_number: drop.shift_number,
          date: drop.date
        });
      } catch (reconcilerError) {
        // Log but don't fail the cash drop creation
        console.error('Error creating reconciler entry:', reconcilerError);
      }
    }
    
    res.status(201).json(drop);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE') || error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cash drop entry already exists for this workstation, shift, and date' });
    }
    console.error('Create cash drop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCashDrops = async (req, res) => {
  try {
    const { datefrom, dateto } = req.query;
    
    if (!datefrom || !dateto) {
      return res.status(400).json({ error: 'Both datefrom and dateto are required' });
    }
    
    const userId = req.user.is_admin ? null : req.user.id;
    const drops = await CashDrop.findByDateRange(datefrom, dateto, userId);
    
    // Add full URL for label images
    const dropsWithImageUrl = drops.map(drop => {
      if (drop.label_image) {
        const baseUrl = req.protocol + '://' + req.get('host');
        return {
          ...drop,
          label_image_url: `${baseUrl}${drop.label_image}`
        };
      }
      return drop;
    });
    
    res.json(dropsWithImageUrl);
  } catch (error) {
    console.error('Get cash drops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const ignoreCashDrop = async (req, res) => {
  try {
    const { id, ignore_reason } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Cash drop ID is required' });
    }
    
    if (!ignore_reason || ignore_reason.trim() === '') {
      return res.status(400).json({ error: 'Ignore reason is required' });
    }
    
    const drop = await CashDrop.findById(id);
    if (!drop) {
      return res.status(404).json({ error: 'Cash drop not found' });
    }
    
    const updated = await CashDrop.update(id, {
      ignored: true,
      ignore_reason: ignore_reason.trim(),
      status: 'ignored'
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Ignore cash drop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCashDrop = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Cash drop ID is required' });
    }
    
    const drop = await CashDrop.findById(id);
    if (!drop) {
      return res.status(404).json({ error: 'Cash drop not found' });
    }
    
    // Only allow deletion of drafts or by the same user
    if (drop.status !== 'drafted' && drop.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Only drafts can be deleted' });
    }
    
    const deleted = await CashDrop.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Cash drop not found' });
    }
    
    res.json({ message: 'Cash drop deleted successfully' });
  } catch (error) {
    console.error('Delete cash drop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
