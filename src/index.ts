import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
