import Anthropic from '@anthropic-ai/sdk';
import { subsumerFinderPrompt } from '../prompts/subsumerFinder.prompt.js';
import { analogyConstructorPrompt } from '../prompts/analogyConstructor.prompt.js';
import { explanationArchitectPrompt } from '../prompts/explanationArchitect.prompt.js';
import { transferTestGenPrompt } from '../prompts/transferTestGen.prompt.js';
import { transferTestEvalPrompt } from '../prompts/transferTestEval.prompt.js';

// Initialize Anthropic client (requires ANTHROPIC_API_KEY env var)
const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper for calling Sonnet (Generation)
const callSonnet = async (prompt) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not found');
    }
    const response = await client.messages.create({
        model: 'claude-3-sonnet-20240229', // Using avail model
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
    });

    // Basic JSON extraction (in a real app, use a more robust parser)
    const text = response.content[0].text;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse LLM JSON:', text);
        throw new Error('LLM returned invalid JSON');
    }
};

// Helper for calling Haiku (Evaluation/Scoring)
const callHaiku = async (prompt) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not found');
    }
    const response = await client.messages.create({
        model: 'claude-3-haiku-20240307', // Using avail model
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
    });

    // Basic JSON extraction
    const text = response.content[0].text;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse LLM JSON:', text);
        throw new Error('LLM returned invalid JSON');
    }
};

// ---- Database Management Functions (for Phase 2) ----
import prisma from '../lib/prisma.js';

/**
 * Stage 1: session/start
 */
export const startSession = async (conceptRaw, userId = null) => {
    const sessionId = crypto.randomUUID();

    // Basic concept parsing (mock for now, or could use LLM)
    const concept = {
        raw: conceptRaw,
        domain: "General", // Placeholder
        abstraction_level: 3,
        prerequisites: []
    };

    const sessionData = await prisma.session.create({
        data: {
            id: sessionId,
            concept: conceptRaw,
            domain: concept.domain,
            userId: userId
        }
    });

    // Return generic fingerprint questions for now (Phase 1 simplicity)
    return {
        session_id: sessionId,
        fingerprint_questions: [
            "What is a hobby or skill you are genuinely good at? (e.g., cooking, guitar, chess)",
            "Explain a tricky problem you solved in that domain recently."
        ]
    };
};

/**
 * Stage 2: session/fingerprint
 */
export const processFingerprint = async (sessionId, answers) => {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    // In a real app, we'd use LLM to extract this.
    // For Phase 1 POC, we'll naively assume the first answer contains the domain.
    const domainGuess = typeof answers === 'string' ? answers.split(' ')[0] : Object.values(answers)[0];

    if (session.userId) {
        // Upsert Fingerprint for authenticated users
        await prisma.fingerprint.upsert({
            where: { userId: session.userId },
            update: {
                dominantDomains: { push: domainGuess },
                strongSubsumers: { push: domainGuess }
            },
            create: {
                userId: session.userId,
                dominantDomains: [domainGuess, "General Knowledge"],
                strongSubsumers: [domainGuess], // Treat the domain as the subsumer source
                reasoningStyle: "narrative" // Default
            }
        });

        // Ensure DomainJourney exists
        if (domainGuess) {
            await prisma.domainJourney.upsert({
                where: { userId_domain: { userId: session.userId, domain: domainGuess } },
                update: {},
                create: { userId: session.userId, domain: domainGuess }
            });
        }
    }

    return {
        session_id: sessionId,
        state_questions: [
            "How frustrated are you with this concept? (1-5)",
            "How urgent is this for you right now? (1-5)"
        ]
    };
};

/**
 * Stage 3: session/explain (THE ENGINE)
 */
export const generateExplanation = async (sessionId, state) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { include: { fingerprint: true } } }
    });

    if (!session) throw new Error('Session not found');

    // If an authenticated user doesn't have a fingerprint, use a mock default
    const fingerprint = session.user?.fingerprint || {
        dominantDomains: ["General Knowledge"],
        strongSubsumers: ["Everyday life"],
        reasoningStyle: "narrative"
    };

    const concept = { raw: session.concept, domain: session.domain, abstraction_level: 3 };

    // 1. Find Subsumer
    const subsumerResult = await callSonnet(
        subsumerFinderPrompt(concept, fingerprint)
    );
    const winningSubsumer = subsumerResult.candidates[0];

    // 2. Build Analogy
    const analogyResult = await callSonnet(
        analogyConstructorPrompt(concept, winningSubsumer)
    );

    // 3. Architect Explanation
    const explanationResult = await callSonnet(
        explanationArchitectPrompt(concept, analogyResult, fingerprint, state)
    );

    // 4. Generate Transfer Test
    const transferTest = await callSonnet(
        transferTestGenPrompt(concept, explanationResult)
    );

    // Store context for evaluation later
    await prisma.session.update({
        where: { id: sessionId },
        data: {
            subsumerUsed: winningSubsumer.subsumer,
            explanation: explanationResult,
            transferTest: {
                scenario: transferTest.scenario,
                question: transferTest.question,
                expected_insight: transferTest.expected_insight // Store the "expected_insight" strictly on server
            }
        }
    });

    return {
        session_id: sessionId,
        ...explanationResult,
        transfer_test: {
            scenario: transferTest.scenario,
            question: transferTest.question
            // Do NOT return expected_insight to client
        }
    };
};

/**
 * Stage 4: session/evaluate
 */
export const evaluateResponse = async (sessionId, userResponse) => {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || !session.transferTest) throw new Error('Session context not found');

    const testContext = session.transferTest; // Contains expected_insight

    const evaluation = await callHaiku(
        transferTestEvalPrompt(testContext, userResponse)
    );

    return {
        session_id: sessionId,
        user_response: userResponse,
        attempt_number: 1,
        clicked: evaluation.score === 'integrated', // Derive simple clicked bool from score
        ...evaluation
    };
};

/**
 * Stage 5: session/retry
 */
export const retryExplanation = async (sessionId, attemptNumber) => {
    // Placeholder for retry logic - would implementation iterating through candidates[1]
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    return generateExplanation(sessionId, null); // Just re-run for now (simulated retry)
};
