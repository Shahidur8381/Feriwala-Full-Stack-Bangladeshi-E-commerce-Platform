import jwt from 'jsonwebtoken';

export default function verifySellerJWT(req, res, next) {
  console.log('Running JWT verification middleware');
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token found in authorization header');
    return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
  }

  try {
    // Use environment variable for secret or fallback to a default
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secretKey);
    
    console.log('Token successfully verified:', decoded);
    
    // Store seller info in both formats for compatibility
    req.seller = decoded;
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(400).json({ success: false, message: 'Invalid token.' });
  }
}