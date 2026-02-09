import { CashDrawer } from '../models/cashDrawerModel.js';

export const createCashDrawer = async (req, res) => {
  try {
    // Determine status: 'drafted' if explicitly set, otherwise 'submitted'
    const status = req.body.status || 'submitted';
    
    // Check if a draft already exists for this workstation/shift/date
    let drawer;
    if (status === 'drafted') {
      const existingDraft = await CashDrawer.findByWorkstationShiftDateStatus(
        req.body.workstation,
        req.body.shift_number,
        req.body.date,
        'drafted'
      );
      
      if (existingDraft) {
        // Update existing draft
        drawer = await CashDrawer.update(existingDraft.id, {
          user_id: req.user.id,
          starting_cash: req.body.starting_cash,
          total_cash: req.body.total_cash,
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
          quarter_rolls: req.body.quarter_rolls || 0,
          dime_rolls: req.body.dime_rolls || 0,
          nickel_rolls: req.body.nickel_rolls || 0,
          penny_rolls: req.body.penny_rolls || 0,
          status: 'drafted'
        });
        return res.status(200).json(drawer);
      }
    }
    
    // Always create a new drawer entry
    // This allows multiple drawers for the same workstation/shift/date when one is ignored
    // Handle both snake_case and camelCase field names from frontend
    const data = {
      user_id: req.user.id,
      workstation: req.body.workstation,
      shift_number: req.body.shift_number,
      date: req.body.date,
      starting_cash: req.body.starting_cash,
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
      quarter_rolls: req.body.quarter_rolls || 0,
      dime_rolls: req.body.dime_rolls || 0,
      nickel_rolls: req.body.nickel_rolls || 0,
      penny_rolls: req.body.penny_rolls || 0,
      total_cash: req.body.total_cash,
      status: status
    };
    
    drawer = await CashDrawer.create(data);
    res.status(201).json(drawer);
  } catch (error) {
    console.error('Create cash drawer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCashDrawer = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Cash drawer ID is required' });
    }
    
    const drawer = await CashDrawer.findById(id);
    if (!drawer) {
      return res.status(404).json({ error: 'Cash drawer not found' });
    }
    
    // Only allow deletion of drafts or by the same user
    if (drawer.status !== 'drafted' && drawer.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Only drafts can be deleted' });
    }
    
    const deleted = await CashDrawer.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Cash drawer not found' });
    }
    
    res.json({ message: 'Cash drawer deleted successfully' });
  } catch (error) {
    console.error('Delete cash drawer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCashDrawers = async (req, res) => {
  try {
    const { datefrom, dateto } = req.query;
    
    if (!datefrom || !dateto) {
      return res.status(400).json({ error: 'Both datefrom and dateto are required' });
    }
    
    const userId = req.user.is_admin ? null : req.user.id;
    const drawers = await CashDrawer.findByDateRange(datefrom, dateto, userId);
    
    res.json(drawers);
  } catch (error) {
    console.error('Get cash drawers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
