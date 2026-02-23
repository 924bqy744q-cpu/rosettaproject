import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/user/journeys — all domain journeys for the authenticated user
router.get('/journeys', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
        }

        const journeys = await prisma.domainJourney.findMany({
            where: { userId: req.userId },
            include: {
                _count: { select: { timeline: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Flatten the count for cleaner API response
        const result = journeys.map(j => ({
            id: j.id,
            domain: j.domain,
            sessionCount: j._count.timeline,
            createdAt: j.createdAt,
            updatedAt: j.updatedAt
        }));

        res.json({ journeys: result });

    } catch (error) {
        console.error('User journeys error:', error);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// GET /api/user/journey/:domain — full journey with session details
router.get('/journey/:domain', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
        }

        const journey = await prisma.domainJourney.findUnique({
            where: {
                userId_domain: { userId: req.userId, domain: req.params.domain }
            },
            include: {
                timeline: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                concept: true,
                                domain: true,
                                subsumerUsed: true,
                                explanation: true,
                                transferTest: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!journey) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Domain journey not found' } });
        }

        res.json(journey);

    } catch (error) {
        console.error('User journey detail error:', error);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// GET /api/user/sessions — all past sessions for the authenticated user
router.get('/sessions', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
        }

        const sessions = await prisma.session.findMany({
            where: { userId: req.userId },
            select: {
                id: true,
                concept: true,
                domain: true,
                subsumerUsed: true,
                explanation: true,
                transferTest: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ sessions });

    } catch (error) {
        console.error('User sessions error:', error);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

export default router;
