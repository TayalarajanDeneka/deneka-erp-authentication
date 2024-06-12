const jwtUtil = require('../utils/jwtUtil');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const decoded = jwtUtil.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
};
