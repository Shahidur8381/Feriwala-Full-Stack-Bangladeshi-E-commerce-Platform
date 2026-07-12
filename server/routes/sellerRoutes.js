// server/routes/sellerRoutes.js
import express from 'express';
import verifySellerJWT from '../middleware/verifySellerJWT.js';

const createSellerRoutes = (db) => {
  const router = express.Router();
  const pool = db.pool;

  // --- POST /sync-profile ---
  router.post('/sync-profile', verifySellerJWT, async (req, res) => {
    const { name, shopName, shopDetails } = req.body;

    if (req.seller.id) {
      return res.status(200).json({
        message: 'Profile already synced',
        seller: req.seller
      });
    }

    const finalName = name || 'New Seller';
    const finalShopName = shopName || 'My Shop';

    try {
      const { rows } = await pool.query(
        `INSERT INTO sellers (auth_id, name, email, password, shopname, shopdetails)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, auth_id, name, email, shopname as "shopName", shopdetails as "shopDetails"`,
        [req.seller.auth_id, finalName, req.seller.email, 'supabase-auth', finalShopName, shopDetails || null]
      );

      res.status(201).json({
        message: 'Seller profile synced successfully',
        seller: rows[0]
      });
    } catch (err) {
      console.error('Error creating seller profile:', err.message);
      res.status(500).json({ error: 'Database error: ' + err.message });
    }
  });

  // --- PUT /update-profile ---
  router.put('/update-profile', verifySellerJWT, async (req, res) => {
    const sellerId = req.seller.id;

    if (!sellerId) {
      return res.status(403).json({ success: false, message: 'Seller profile not completed' });
    }

    const sellerData = req.body.seller || req.body;
    const { name, shopName, shopDetails } = sellerData;

    if (!name && !shopName && shopDetails === undefined) {
      return res.status(400).json({ success: false, message: 'Provide at least one field to update' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name) { updates.push(`name = $${paramIndex++}`); params.push(name); }
    if (shopName) { updates.push(`shopname = $${paramIndex++}`); params.push(shopName); }
    if (shopDetails !== undefined) {
      updates.push(`shopdetails = $${paramIndex++}`);
      params.push(typeof shopDetails === 'object' ? JSON.stringify(shopDetails) : shopDetails);
    }

    params.push(sellerId);

    try {
      await pool.query(
        `UPDATE sellers SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      );

      const { rows } = await pool.query(
        'SELECT id, auth_id, name, email, shopname as "shopName", shopdetails as "shopDetails" FROM sellers WHERE id = $1',
        [sellerId]
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        seller: rows[0]
      });
    } catch (err) {
      console.error('Database error during profile update:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  });

  // --- GET /profile ---
  router.get('/profile', verifySellerJWT, (req, res) => {
    const sellerId = req.seller.id;
    if (!sellerId) {
      return res.status(404).json({ error: 'Seller profile not completed' });
    }
    res.json({ seller: req.seller });
  });

  // --- GET / --- (Handles GET /api/sellers)
  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, auth_id, name, email, shopname as "shopName", shopdetails as "shopDetails" FROM sellers'
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching sellers:', err.message);
      res.status(500).json({ error: 'Database error: ' + err.message });
    }
  });

  return router;
};

export default createSellerRoutes;