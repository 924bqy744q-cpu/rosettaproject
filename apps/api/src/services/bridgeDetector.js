/**
 * Cross-Domain Bridge Detector
 * 
 * After a session is scored, checks if the subsumer used overlaps with
 * subsumers from other sessions in different domains. If so, creates
 * a CrossDomainBridge record linking them.
 */

import prisma from '../lib/prisma.js';

/**
 * Normalize a subsumer string for comparison.
 * Lowercases, trims, and removes common filler words.
 */
function normalizeSubsumer(s) {
    if (!s) return '';
    return s.toLowerCase().trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');
}

/**
 * Calculate simple word overlap similarity between two strings.
 * Returns a value between 0 and 1.
 */
function similarity(a, b) {
    const wordsA = new Set(normalizeSubsumer(a).split(' '));
    const wordsB = new Set(normalizeSubsumer(b).split(' '));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
        if (wordsB.has(word)) intersection++;
    }

    // Jaccard similarity
    const union = new Set([...wordsA, ...wordsB]).size;
    return intersection / union;
}

/**
 * Detect cross-domain bridges for a completed session.
 * 
 * @param {string} sessionId - The session that was just completed
 * @param {string} userId - The authenticated user
 */
export async function detectBridges(sessionId, userId) {
    if (!userId) return [];

    const currentSession = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, concept: true, domain: true, subsumerUsed: true }
    });

    if (!currentSession?.subsumerUsed) return [];

    // Find other completed sessions with subsumers
    const otherSessions = await prisma.session.findMany({
        where: {
            userId,
            id: { not: sessionId },
            subsumerUsed: { not: null }
        },
        select: { id: true, concept: true, domain: true, subsumerUsed: true }
    });

    const bridges = [];

    for (const other of otherSessions) {
        // Skip if same concept (not a cross-domain bridge)
        if (normalizeSubsumer(other.concept) === normalizeSubsumer(currentSession.concept)) continue;

        const sim = similarity(currentSession.subsumerUsed, other.subsumerUsed);

        if (sim >= 0.5) {
            // Check if bridge already exists (in either direction)
            const existing = await prisma.crossDomainBridge.findFirst({
                where: {
                    OR: [
                        { sourceSessionId: sessionId, targetSessionId: other.id },
                        { sourceSessionId: other.id, targetSessionId: sessionId }
                    ]
                }
            });

            if (!existing) {
                try {
                    const bridge = await prisma.crossDomainBridge.create({
                        data: {
                            userId,
                            sourceSessionId: sessionId,
                            targetSessionId: other.id,
                            sharedPattern: currentSession.subsumerUsed,
                            confidence: sim
                        }
                    });
                    bridges.push(bridge);
                } catch (err) {
                    // Ignore unique constraint violations (race condition)
                    if (err.code !== 'P2002') throw err;
                }
            }
        }
    }

    return bridges;
}
