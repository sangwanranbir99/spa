const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        throw new Error('Unauthorized, no token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password').populate('branches');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        throw new Error('Unauthorized, invalid token');
    }
};

module.exports = authMiddleware;
