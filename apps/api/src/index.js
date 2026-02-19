import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Import routes
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/session.js';
import { authenticateUser } from './middleware/authenticateUser.js';

app.use(authenticateUser);
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            session_id: req.body?.session_id || null
        }
    });
});

app.listen(PORT, () => {
    console.log(`Rosetta Engine API running on port ${PORT}`);
});
