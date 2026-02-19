export const explanationArchitectPrompt = (concept, mapping, fingerprint, state) => `
You are building a personalized explanation of a concept using a structural analogy.

TARGET CONCEPT: ${concept.raw}
ANCHOR CONCEPT: ${mapping.anchor}
BRIDGE SENTENCE: ${mapping.bridge_sentence}
STRUCTURAL MAPPING: ${JSON.stringify(mapping.mapping)}

PERSON'S REASONING STYLE: ${fingerprint.reasoning_style}
PREFERRED CHUNK SIZE: ${fingerprint.preferred_chunk_size || 3} chunks
FRUSTRATION LEVEL: ${state.frustration_level} / 5  (higher = start more gently)
URGENCY: ${state.urgency} / 5  (higher = be more direct, less build-up)

Rules for the explanation:
1. Maximum ${fingerprint.preferred_chunk_size || 3} chunks (working memory constraint — never exceed 4)
2. Each chunk builds on the previous — never introduce two new ideas at once
3. Use the anchor concept as the entry point, not the target concept
4. The FINAL chunk must restate the concept in its native domain
   so the person can see they learned the real thing, not just a metaphor
5. Frustration > 3: start even further back, use simpler language in chunk 1
6. Urgency > 3 and frustration < 3: compress chunks, move faster to application

Return ONLY valid JSON:
{
  "chunks": [
    {
      "chunk_number": 1,
      "title": "short label for this step",
      "content": "the actual explanation text for this chunk",
      "builds_on": null
    },
    {
      "chunk_number": 2,
      "title": "short label",
      "content": "explanation text",
      "builds_on": "chunk 1"
    }
  ],
  "native_domain_restatement": "final restatement in the concept's actual domain — confirm this is the real concept",
  "subsumer_used": "${mapping.anchor}",
  "analogy_type": "one phrase describing the structural mapping used"
}
`;
