import { createClient } from '@supabase/supabase-js';
import db from '../database/supabaseDb.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function verifySellerJWT(req, res, next) {
  
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
  }

  try {
    // Let Supabase API securely verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase Auth verification error:', error?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    
    
    // Find the local seller profile using the Supabase auth_id
    db.get('SELECT * FROM sellers WHERE auth_id = ? OR email = ?', [user.id, user.email], (err, seller) => {
      if (err) {
        console.error('Error fetching seller by auth_id:', err);
        return res.status(500).json({ success: false, message: 'Database error.' });
      }

      if (seller) {
        req.seller = seller;
        req.user = seller; // For compatibility
      } else {
        // If no seller profile exists yet, just attach the user data.
        // The profile creation endpoint will handle inserting the new seller.
        req.seller = { auth_id: user.id, email: user.email };
        req.user = req.seller;
      }
      next();
    });
  } catch (error) {
    console.error('Internal auth error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}