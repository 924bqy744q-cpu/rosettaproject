import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rosetta-development-secret-123';

export const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Continue but with no req.userId (Anonymous session)
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
    } catch (error) {
        // Invalid token, still continue anonymously or reject? 
        // For Phase 2 transition we'll just ignore bad tokens and let them be anonymous
        console.warn('Invalid JWT token received');
    }

    next();
};
