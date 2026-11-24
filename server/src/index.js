import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { initReminderCron } from './jobs/reminderCron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'MediBridge Server & API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Start Server and Database Connection
const startServer = async () => {
  try {
    await connectDB();
    initReminderCron();
    app.listen(PORT, () => {
      console.log(`[MediBridge] Server running on http://localhost:${PORT}`);
      console.log(`[MediBridge] API endpoints active at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error(`[MediBridge Error] Failed to start server:`, err.message);
    process.exit(1);
  }
};

startServer();

export default app;
