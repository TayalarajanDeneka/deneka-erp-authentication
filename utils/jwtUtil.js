require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

module.exports = {
    generateToken: (user) => {
        const jwtToken = jwt.sign({ userId: user.User_ID, role: user.Role_ID }, secret, { expiresIn: '1h' });
        console.log(jwtToken);
        return jwtToken;
    },
    verifyToken: (token) => {
        console.log(secret)
        try {
            return jwt.verify(token, secret);
        } catch (e) {
            return null;
        }
    }
};
