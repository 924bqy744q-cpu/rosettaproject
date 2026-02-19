export const transferTestGenPrompt = (concept, explanation) => `
You are generating a transfer test for a concept that was just explained.

TARGET CONCEPT: ${concept.raw}
SUBSUMER USED IN EXPLANATION: ${explanation.subsumer_used}
ANALOGY TYPE: ${explanation.analogy_type}

A transfer test checks whether the person genuinely understood the concept,
not just the analogy. It must:
1. Present a scenario in a THIRD domain (not the target concept's domain, 
   not the subsumer's domain)
2. Require applying the concept's core principle to solve it
3. Have a clear correct reasoning path (but not a single "right answer" word)

Return ONLY valid JSON:
{
  "scenario": "the scenario presented to the user — 2-4 sentences",
  "question": "the specific question asked",
  "expected_insight": "what a correct response would demonstrate (internal use only — never shown to user)",
  "common_misconception": "what a surface-level (non-integrated) response looks like"
}
`;
