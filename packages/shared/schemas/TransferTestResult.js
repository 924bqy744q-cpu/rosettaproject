export const TransferTestResultSchema = {
    type: "object",
    properties: {
        session_id: { type: "string" },
        user_response: { type: "string" },
        score: { type: "string", enum: ["integrated", "surface", "not_yet"] },
        score_reasoning: { type: "string" },
        clicked: { type: "boolean" },
        attempt_number: { type: "integer" }
    },
    required: ["session_id", "user_response", "score", "score_reasoning", "clicked", "attempt_number"]
};
