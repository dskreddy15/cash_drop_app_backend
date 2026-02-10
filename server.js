import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import cashDrawerRoutes from "./routes/cashDrawerRoutes.js";
import cashDropRoutes from "./routes/cashDropRoutes.js";
import cashDropReconcilerRoutes from "./routes/cashDropReconcilerRoutes.js";
import bankDropRoutes from "./routes/bankDropRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000; // Use the PORT environment variable from .env file

// Track if database is ready
let dbReady = false;

// CORS configuration - Allow all localhost ports for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (NODE_ENV === 'development') {
    // Allow localhost on any port for development
      if (origin.match(/^http:\/\/localhost:\d+$/) || 
          origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
        return callback(null, true);
      }
    }
    
    if (NODE_ENV === 'production') {
    // In production, you should specify exact origins
    if (origin.match(process.env.REACT_APP_URL)) {
      return callback(null, true);
      }
    }
    callback(null, true); // For now, allow all origins in development
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve media files
app.use('/media', express.static(path.join(__dirname, 'media')));

// API routes - matching Django URL structure
app.use("/api/auth", authRoutes);
app.use("/api/cash-drop-app1/cash-drawer", cashDrawerRoutes);
app.use("/api/cash-drop-app1/cash-drop", cashDropRoutes);
app.use("/api/cash-drop-app1/cash-drop-reconciler", cashDropReconcilerRoutes);
app.use("/api/bank-drop", bankDropRoutes);
app.use("/api/admin-settings", adminSettingsRoutes);

// Health check endpoint - includes database status
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: dbReady ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// Middleware to check database readiness (except for health endpoint)
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  
  if (!dbReady) {
    return res.status(503).json({ 
      error: 'Service temporarily unavailable. Database is initializing.',
      retryAfter: 5
    });
  }
  
  next();
});

// Global error handler (must be after routes)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    dbReady = true;
    console.log('Database initialized successfully');
    
    // Start server only after database is ready
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Server will not start without database connection.');
    
    // Exit with error code so process manager can restart
    process.exit(1);
  }
};

// Start the application
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;