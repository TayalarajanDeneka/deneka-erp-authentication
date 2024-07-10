require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const resetSecret = process.env.JWT_RESET_SECRET;

module.exports = {
  generateToken: (user) => {
    try {
      console.log('Generating JWT token for user:', user);
      const jwtToken = jwt.sign({ userId: user.User_ID, role: user.Role_ID }, secret, { expiresIn: '1h' });
      console.log('Generated JWT token:', jwtToken);
      return jwtToken;
    } catch (error) {
      console.error('Error generating JWT token:', error.message);
      throw new Error('Failed to generate token');
    }
  },
  verifyToken: (token) => {
    try {
      console.log('Verifying JWT token:', token);
      const decoded = jwt.verify(token, secret);
      console.log('Verified JWT token. Decoded:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error verifying JWT token:', error.message);
      return null;
    }
  },
  generateResetToken: (data) => {
    try {
      console.log('Generating reset token for data:', data);
      const jwtResetToken = jwt.sign({ email: data.email }, resetSecret, { expiresIn: '1h' });
      console.log('Generated reset token:', jwtResetToken);
      const verifiedToken = jwt.verify(jwtResetToken, resetSecret);
      console.log('Verified reset token immediately after generation:', verifiedToken);
      return jwtResetToken;
    } catch (error) {
      console.error('Error generating reset token:', error.message);
      throw new Error('Failed to generate reset token');
    }
  },
  verifyResetToken: (token) => {
    try {
      console.log('Verifying reset token:', token);
      const decoded = jwt.verify(token, resetSecret);
      console.log('Verified reset token. Decoded:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error verifying reset token:', error.message);
      return null;
    }
  }
};
