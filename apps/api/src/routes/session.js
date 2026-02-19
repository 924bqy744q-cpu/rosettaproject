import express from 'express';
import { validateSession } from '../middleware/validateSession.js';
import * as engine from '../services/rosettaEngine.js';

const router = express.Router();

router.post('/start', async (req, res) => {
    try {
        const { concept } = req.body;
        if (!concept) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Concept is required' } });
        }
        const result = await engine.startSession(concept, req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: { code: 'ENGINE_FAILED', message: error.message } });
    }
});

router.post('/fingerprint', async (req, res) => {
    try {
        const { session_id, answers } = req.body;
        if (!session_id || !answers) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Session ID and answers are required' } });
        }
        const result = await engine.processFingerprint(session_id, answers);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: { code: 'ENGINE_FAILED', message: error.message } });
    }
});

router.post('/explain', async (req, res) => {
    try {
        const { session_id, state } = req.body;
        if (!session_id || !state) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Session ID and state are required' } });
        }
        const result = await engine.generateExplanation(session_id, state);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: { code: 'ENGINE_FAILED', message: error.message } });
    }
});

router.post('/evaluate', async (req, res) => {
    try {
        const { session_id, user_response, clicked } = req.body;
        if (!session_id || user_response === undefined) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Session ID and user response are required' } });
        }
        const result = await engine.evaluateResponse(session_id, user_response);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: { code: 'ENGINE_FAILED', message: error.message } });
    }
});

router.post('/retry', async (req, res) => {
    try {
        const { session_id, attempt_number } = req.body;
        if (!session_id || !attempt_number) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Session ID and attempt number are required' } });
        }
        const result = await engine.retryExplanation(session_id, attempt_number);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: { code: 'ENGINE_FAILED', message: error.message } });
    }
});

export default router;
