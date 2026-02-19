export const analogyConstructorPrompt = (concept, winningSubsumer) => `
You are building a structural analogy bridge between two concepts.

TARGET CONCEPT: ${concept.raw}
ANCHOR (what this person already understands): ${winningSubsumer.subsumer}
STRUCTURAL MAPPING: ${winningSubsumer.structural_mapping}

Your task: build the precise component-by-component mapping between these two concepts.
Map every key element of the target concept to its equivalent in the anchor concept.

Important rules:
- Map STRUCTURE, not surface appearance
- Only map elements that genuinely correspond — do not force mappings
- Note where the analogy breaks down honestly

Return ONLY valid JSON:
{
  "mapping": [
    {
      "target_element": "element in the concept being learned",
      "anchor_element": "equivalent element in the subsumer",
      "relationship": "how they correspond structurally"
    }
  ],
  "analogy_breaks_at": "where this analogy stops being accurate",
  "bridge_sentence": "one sentence that captures the core structural insight"
}
`;
