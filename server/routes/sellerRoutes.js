// server/routes/sellerRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import verifySellerJWT from '../middleware/verifySellerJWT.js';

const router = express.Router();

// --- Rate limiter ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 999, 
  message: { error: 'Too many login attempts. Please try again later.' },
});

// --- Helpers ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, router.secretKey, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Store in both user and seller for consistency
    req.user = decoded; 
    req.seller = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      shopName: decoded.shopName,
      shopDetails: decoded.shopDetails || null
    };
    console.log("Authenticated user:", req.user.id);
    next();
  });
};

// --- POST /signup ---
router.post('/signup', async (req, res) => {
  const { name, email, password, shopName, shopDetails } = req.body;

  if (!name || !email || !password || !shopName) {
    return res.status(400).json({ error: 'All fields except shopDetails are required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, and a number',
    });
  }

  const db = req.db || router.db;
  db.get('SELECT * FROM sellers WHERE email = ?', [email], async (err, existingSeller) => {
    if (err) {
        console.error("Error checking for existing seller:", err.message);
        return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (existingSeller) {
        return res.status(400).json({ error: 'Seller already exists with this email' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        `INSERT INTO sellers (name, email, password, shopName, shopDetails) VALUES (?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, shopName, shopDetails || null], 
        function (err) { 
          if (err) {
            console.error("Error inserting new seller:", err.message);
            return res.status(500).json({ error: "Database error: " + err.message });
          }
          const newSeller = {
            id: this.lastID,
            name,
            email,
            shopName,
            shopDetails: shopDetails || null
          };
          res.status(201).json({
            message: 'Signup successful',
            seller: newSeller
          });
        }
      );
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return res.status(500).json({ error: 'Error processing signup' });
    }
  });
});

// --- POST /login ---
router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = req.db || router.db; 
  db.get('SELECT * FROM sellers WHERE email = ?', [email], async (err, seller) => {
    if (err) {
        console.error("Error fetching seller for login:", err.message);
        return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
    }

    try {
      const isMatch = await bcrypt.compare(password, seller.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }      // Create a consistent token payload with all seller details
      const tokenPayload = { 
        id: seller.id, 
        email: seller.email, 
        name: seller.name,
        shopName: seller.shopName,
        shopDetails: seller.shopDetails || null
      };
      const token = jwt.sign(
        tokenPayload, 
        router.secretKey, 
        { expiresIn: '1h' } 
      );
      res.json({
        message: 'Login successful',
        token,
        seller: { 
          id: seller.id, 
          name: seller.name, 
          email: seller.email,
          shopName: seller.shopName,
          shopDetails: seller.shopDetails || null
        },
      });
    } catch (compareError) {
      console.error('Error comparing passwords:', compareError);
      return res.status(500).json({ error: 'Error processing login' });
    }
  });
});


// --- PUT /update-profile ---
router.put('/update-profile', verifySellerJWT, (req, res) => {
  const db = req.db || router.db;
  console.log('Update profile request received:', req.body);
  console.log('Auth debug - req.seller:', req.seller);
  console.log('Auth debug - req.user:', req.user);
  
  // Get seller ID from token (works with both auth middlewares)
  const sellerId = req.seller?.id || req.user?.id;
  
  if (!sellerId) {
    console.log('No seller ID found in request');
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  console.log(`Processing update for seller ID: ${sellerId}`);
  
  // Extract the seller data from the nested structure
  const sellerData = req.body.seller || req.body;
  console.log('Extracted seller data:', sellerData);
  
  // Check if any updateable field is provided
  const { name, email, password, shopName, shopDetails } = sellerData;
  
  if (!name && !email && !password && !shopName && 
      (shopDetails === undefined || shopDetails === null)) {
    console.log('No fields to update were provided');
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide at least one field to update' 
    });
  }
  
  // Start building the SQL query
  let sql = 'UPDATE sellers SET ';
  const params = [];
  const updates = [];
  
  // Add each field to the update if it exists
  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  
  if (password) {
    updates.push('password = ?');
    params.push(bcrypt.hashSync(password, 10));
  }
  
  if (shopName) {
    updates.push('shopName = ?');
    params.push(shopName);
  }
  
  if (shopDetails !== undefined && shopDetails !== null) {
    updates.push('shopDetails = ?');
    // Handle object or string formats
    if (typeof shopDetails === 'object') {
      params.push(JSON.stringify(shopDetails));
    } else {
      params.push(shopDetails);
    }
  }
  
  // Complete the SQL query
  sql += updates.join(', ') + ' WHERE id = ?';
  params.push(sellerId);
  
  console.log('Executing SQL:', sql);
  console.log('With params:', params);
  
  // Execute the update
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Database error during profile update:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: err.message
      });
    }
    
    if (this.changes === 0) {
      console.log('No rows were updated');
      return res.status(404).json({
        success: false,
        message: 'Seller not found or no changes made'
      });
    }
    
    console.log(`Successfully updated ${this.changes} rows`);
    
    // Get updated seller data
    db.get('SELECT id, name, email, shopName, shopDetails FROM sellers WHERE id = ?', 
      [sellerId], (err, seller) => {
        if (err) {
          console.error('Error retrieving updated seller:', err);
          return res.status(200).json({
            success: true,
            message: 'Profile updated successfully, but could not retrieve updated data'
          });
        }
        
        // Generate new token with updated info
        const secretKey = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign({
          id: seller.id,
          email: seller.email,
          name: seller.name,
          shopName: seller.shopName,
          shopDetails: seller.shopDetails
        }, secretKey, { expiresIn: '24h' });
        
        console.log('New token generated with updated info');
        
        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          seller: {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            shopName: seller.shopName,
            shopDetails: seller.shopDetails
          },
          token
        });
      });
  });
});


// --- GET /profile ---
router.get('/profile', authenticateToken, (req, res) => {
  const db = req.db || router.db;
  const sellerId = req.seller?.id || req.user?.id;
  console.log("Getting profile for seller ID:", sellerId);

  const sql = `SELECT id, name, email, shopName, shopDetails FROM sellers WHERE id = ?`;

  db.get(sql, [sellerId], (err, row) => {
    if (err) {
      console.error("Error fetching seller profile:", err.message);
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Generate a fresh token with the latest user data
    const tokenPayload = {
      id: row.id,
      name: row.name,
      email: row.email,
      shopName: row.shopName,
      shopDetails: row.shopDetails || null
    };
    
    const token = jwt.sign(
      tokenPayload,
      router.secretKey,
      { expiresIn: '1h' }
    );
    
    res.json({
      seller: {
        id: row.id,
        name: row.name,
        email: row.email,
        shopName: row.shopName,
        shopDetails: row.shopDetails || null 
      },
      token
    });
  });
});

// --- GET / --- (Handles GET /api/sellers)
// Fetches all sellers' details as a direct array.
router.get('/', (req, res) => { 
  const db = req.db || router.db;

  const sql = `SELECT id, name, email, shopName, shopDetails FROM sellers`;

  db.all(sql, [], (err, rows) => { 
    if (err) {
      console.error("Error fetching all sellers:", err.message);
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    
    const sellers = rows.map(seller => ({
        ...seller,
        shopDetails: seller.shopDetails === null ? null : seller.shopDetails
    }));

    res.json(sellers); // MODIFIED LINE: Return the array directly
  });
});


// --- Export router ---
export default (db, secretKey) => {
  router.db = db; 
  router.secretKey = secretKey || process.env.JWT_SECRET || 'your_default_secret_key_please_change_this'; 
  
  // Print the secret key being used (first few characters only for security)
  const secretPreview = router.secretKey ? `${router.secretKey.substring(0, 3)}...` : 'undefined';
  console.log(`Seller routes initialized with secret key: ${secretPreview}`);
  
  if (router.secretKey === 'your_default_secret_key_please_change_this') {
    console.warn('WARNING: Using default JWT secret key. Please change this in a production environment!');
  }
  
  return router;
};