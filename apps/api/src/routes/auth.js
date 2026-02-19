import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rosetta-development-secret-123';

// Simple passwordless login/signup
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Email is required' } });
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Lazy creation for Phase 2 proof of concept
            user = await prisma.user.create({
                data: { email }
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({ user, token });

    } catch (error) {
        res.status(500).json({ error: { code: 'AUTH_FAILED', message: error.message } });
    }
});

// Get current user details + fingerprint + journeys
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                fingerprint: true,
                domainJourneys: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }

        res.json(user);

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
        }
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

export default router;
