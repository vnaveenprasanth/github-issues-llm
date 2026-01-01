import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { initializeDatabase } from './db';

// Load environment variables
dotenv.config();

// Initialize database
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API routes
app.use('/', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Endpoints available:`);
    console.log(`   POST /scan    - Fetch and cache GitHub issues`);
    console.log(`   POST /analyze - Analyze cached issues with LLM`);
    console.log(`   GET  /health  - Health check`);
});

export default app;
