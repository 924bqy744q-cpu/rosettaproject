/**
 * Spaced Repetition Service — SM-2 Algorithm
 * 
 * After each review, computes the next optimal review date.
 * Based on the SuperMemo SM-2 algorithm:
 * - Quality 5 (integrated): strong recall, increase interval
 * - Quality 3 (surface): partial recall, moderate interval
 * - Quality 1 (not_yet): failed recall, reset to 1 day
 */

const SCORE_TO_QUALITY = {
    'integrated': 5,
    'surface': 3,
    'not_yet': 1
};

/**
 * Compute the next review schedule based on SM-2.
 * 
 * @param {string} score - 'integrated' | 'surface' | 'not_yet'
 * @param {number} currentInterval - current interval in days (default 1)
 * @param {number} easeFactor - current ease factor (default 2.5)
 * @param {number} repetitions - number of successful repetitions (default 0)
 * @returns {{ nextReviewAt: Date, intervalDays: number, easeFactor: number, repetitions: number }}
 */
export function computeNextReview(score, currentInterval = 1, easeFactor = 2.5, repetitions = 0) {
    const quality = SCORE_TO_QUALITY[score] ?? 3;

    let newInterval;
    let newEaseFactor;
    let newRepetitions;

    if (quality < 3) {
        // Failed — reset
        newInterval = 1;
        newRepetitions = 0;
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
        // Successful recall
        newRepetitions = repetitions + 1;

        if (newRepetitions === 1) {
            newInterval = 1;
        } else if (newRepetitions === 2) {
            newInterval = 3;
        } else {
            newInterval = Math.round(currentInterval * easeFactor);
        }

        // Adjust ease factor
        newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEaseFactor = Math.max(1.3, newEaseFactor); // minimum 1.3
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    return {
        nextReviewAt,
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions
    };
}
