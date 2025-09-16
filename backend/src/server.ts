import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db/database';
import { emailService } from './services/emailService';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import quoteRoutes from './routes/quotes';
import shipmentRoutes from './routes/shipments';
import userRoutes from './routes/users';
import announcementRoutes from './routes/announcements';
import emailRoutes from './routes/email';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/email', emailRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('\n📚 Available endpoints:');
      console.log('  - GET  /health');
      console.log('  - POST /api/auth/login');
      console.log('  - POST /api/auth/register');
      console.log('  - POST /api/auth/logout');
      console.log('  - GET  /api/auth/validate');
      console.log('  - GET  /api/quotes');
      console.log('  - GET  /api/quotes/requests');
      console.log('  - GET  /api/shipments');
      console.log('  - GET  /api/users');
      console.log('  - GET  /api/announcements');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();