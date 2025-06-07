import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get current active token
router.get('/token', (req, res) => {
  const db = req.db;
  
  db.get(
    'SELECT * FROM seller_admin_token_store WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1',
    (err, row) => {
      if (err) {
        logger.error('Error fetching active token:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ token: row?.token || null });
    }
  );
});

// Generate and save new token
router.post('/token', (req, res) => {
  const { token } = req.body;
  const db = req.db;
  
  if (!token || token.length !== 32) {
    return res.status(400).json({ error: 'Invalid token. Must be 32 characters long.' });
  }
  
  // Deactivate all previous tokens
  db.run('UPDATE seller_admin_token_store SET is_active = 0', (err) => {
    if (err) {
      logger.error('Error deactivating previous tokens:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Insert new active token
    db.run(
      'INSERT INTO seller_admin_token_store (token, is_active) VALUES (?, 1)',
      [token],
      function(err) {
        if (err) {
          logger.error('Error saving new token:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        logger.info('New seller admin token generated and saved');
        res.json({ 
          success: true, 
          token: token,
          id: this.lastID 
        });
      }
    );
  });
});

// Get token history
router.get('/tokens/history', (req, res) => {
  const db = req.db;
  
  db.all(
    'SELECT * FROM seller_admin_token_store ORDER BY created_at DESC LIMIT 10',
    (err, rows) => {
      if (err) {
        logger.error('Error fetching token history:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json(rows || []);
    }
  );
});

// Verify token (for admin panel use)
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  const db = req.db;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  db.get(
    'SELECT * FROM seller_admin_token_store WHERE token = ? AND is_active = 1',
    [token],
    (err, row) => {
      if (err) {
        logger.error('Error verifying token:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (row) {
        res.json({ valid: true, message: 'Token is valid' });
      } else {
        res.json({ valid: false, message: 'Invalid or inactive token' });
      }
    }
  );
});

export default router;
