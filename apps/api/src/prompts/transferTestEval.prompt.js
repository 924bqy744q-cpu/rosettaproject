export const transferTestEvalPrompt = (test, userResponse) => `
Score this transfer test response.

SCENARIO SHOWN TO USER: ${test.scenario}
QUESTION ASKED: ${test.question}
EXPECTED INSIGHT: ${test.expected_insight}
COMMON MISCONCEPTION: ${test.common_misconception}

USER RESPONSE: ${userResponse}

Scoring rubric:
- "integrated": user demonstrates the core principle, could apply it again in another context
- "surface": user restates the analogy but doesn't show they can apply the principle independently  
- "not_yet": user misses the core principle, response suggests the concept did not integrate

Return ONLY valid JSON:
{
  "score": "integrated | surface | not_yet",
  "reasoning": "one sentence explaining the score",
  "what_they_got": "what the user did understand",
  "what_is_missing": "what is not yet there (null if integrated)"
}
`;
