export const SessionContextSchema = {
  type: "object",
  properties: {
    session_id: { type: "string" },
    created_at: { type: "string", format: "date-time" },
    concept: {
      type: "object",
      properties: {
        raw: { type: "string" },
        domain: { type: "string" },
        abstraction_level: { type: "integer", minimum: 1, maximum: 5 },
        prerequisites: { type: "array", items: { type: "string" } }
      },
      required: ["raw", "domain", "abstraction_level", "prerequisites"]
    },
    fingerprint: {
      type: "object",
      properties: {
        dominant_domains: { type: "array", items: { type: "string" } },
        strong_subsumers: { type: "array", items: { type: "string" } },
        reasoning_style: { type: "string", enum: ["narrative", "logical", "visual", "mechanical"] }
      },
      required: ["dominant_domains", "strong_subsumers", "reasoning_style"]
    },
    state: {
      type: "object",
      properties: {
        urgency: { type: "integer", minimum: 1, maximum: 5 },
        frustration_level: { type: "integer", minimum: 1, maximum: 5 }
      },
      required: ["urgency", "frustration_level"]
    }
  },
  required: ["session_id", "created_at", "concept", "fingerprint", "state"]
};
