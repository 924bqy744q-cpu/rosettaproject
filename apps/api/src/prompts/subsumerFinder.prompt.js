export const subsumerFinderPrompt = (concept, fingerprint) => `
You are analyzing what mental models a person already owns that could serve as 
a cognitive anchor for learning a new concept.

TARGET CONCEPT: ${concept.raw}
DOMAIN: ${concept.domain}
ABSTRACTION LEVEL: ${concept.abstraction_level} / 5

THIS PERSON'S KNOWN MENTAL MODELS:
- Dominant knowledge domains: ${fingerprint.dominantDomains.join(', ')}
- Strong subsumers (specific things they understand deeply): ${fingerprint.strongSubsumers.join(', ')}
- Reasoning style: ${fingerprint.reasoningStyle}

A subsumer is an existing mental model that shares STRUCTURAL similarity 
(not surface similarity) with the target concept. 

For example:
- Compound interest and harmonic series share the structure of multiplicative growth over time
- Chord progressions and function composition share the structure of sequenced building blocks
- Traffic flow and TCP/IP packets share the structure of batched units navigating bottlenecks

Your task: identify the top 3 subsumer candidates from this person's known domains.

Return ONLY valid JSON, no other text:
{
  "candidates": [
    {
      "subsumer": "specific concept name from their domain",
      "domain": "which of their domains this comes from",
      "structural_mapping": "one sentence: what structural property is shared",
      "match_score": 0.0-1.0,
      "risk": "one sentence: where this analogy might break down"
    }
  ]
}
`;
