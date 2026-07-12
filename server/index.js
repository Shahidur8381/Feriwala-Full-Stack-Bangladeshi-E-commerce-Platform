import express from 'express'; 
import cors from 'cors';
import helmet from 'helmet';
import db from './database/supabaseDb.js'; 
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import createSellerRoutes from './routes/sellerRoutes.js';
import createProductRoutes from './routes/productRoutes.js';
import createOrderRoutes from './routes/orderRoutes.js';
import createReviewRoutes from './routes/reviewRoutes.js';
import createAdminRoutes from './routes/adminRoutes.js';
import createPaymentRoutes from './routes/paymentRoutes.js';
import sellerAdminTokenRoutes from './routes/sellerAdminTokenRoutes.js';
import verifySellerJWT from './middleware/verifySellerJWT.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

// ── Security: Validate critical env vars ─────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not set. Using fallback — set this in production!');
}
if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL is not set. Exiting.');
  process.exit(1);
}

// ── File Uploads ─────────────────────────────────────────────────────────────
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  }
});

// ── Express App ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin image loading
}));

// CORS — whitelist allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadPath));

// ── Route Mounting ───────────────────────────────────────────────────────────
app.use('/api/sellers', createSellerRoutes(db)); 
app.use('/api/products', createProductRoutes(db, upload));
app.use('/api/orders', createOrderRoutes(db));
app.use('/api/reviews', createReviewRoutes(db));
app.use('/api/admin', createAdminRoutes(db));
app.use('/api/payment', createPaymentRoutes(db));

// Seller admin token routes
app.use('/api/seller-admin', (req, res, next) => {
  req.db = db;
  next();
}, sellerAdminTokenRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FeriWala API is running', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message,
  });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FeriWala API running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});