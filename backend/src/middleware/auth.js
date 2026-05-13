'use strict';

const { verifyAccessToken } = require('../utils/jwt');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const result = verifyAccessToken(token);
    if (!result.valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = result.user;
    next();
}

module.exports = { verifyToken };
