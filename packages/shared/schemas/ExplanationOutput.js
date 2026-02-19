export const ExplanationOutputSchema = {
    type: "object",
    properties: {
        session_id: { type: "string" },
        subsumer_used: { type: "string" },
        analogy_type: { type: "string" },
        chunks: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    chunk_number: { type: "integer" },
                    content: { type: "string" },
                    builds_on: { type: "string", nullable: true }
                },
                required: ["chunk_number", "content"]
            },
            maxItems: 4
        },
        native_domain_restatement: { type: "string" },
        transfer_test: {
            type: "object",
            properties: {
                scenario: { type: "string" },
                expected_insight: { type: "string" }
            },
            required: ["scenario", "expected_insight"]
        }
    },
    required: ["session_id", "subsumer_used", "analogy_type", "chunks", "native_domain_restatement", "transfer_test"]
};
