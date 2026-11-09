import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.js';
import { startScheduler } from './services/scheduler.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', dashboardRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🏥 Dashboard RS — Backend Server       ║');
  console.log(`║   🌐 http://0.0.0.0:${PORT}                ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Start the cron scheduler after server is ready
  startScheduler();
});
