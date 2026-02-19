import { SessionContextSchema } from '@rosetta/shared';

// Basic validation function - in a real app, use a library like ajv
const validate = (schema, data) => {
    // Placeholder for schema validation logic
    // For Phase 1, we might just check for required top-level keys
    const required = schema.required || [];
    const missing = required.filter(key => !data || data[key] === undefined);
    if (missing.length > 0) return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
    return { valid: true };
};

export const validateSession = (req, res, next) => {
    const { session } = req.body;
    if (!session) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Session data required' } });
    }

    const { valid, errors } = validate(SessionContextSchema, session);
    if (!valid) {
        return res.status(400).json({ error: { code: 'INVALID_SESSION', message: errors.join('; ') } });
    }

    next();
};
