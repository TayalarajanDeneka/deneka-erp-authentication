const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwtUtil');
const MFA = require('../utils/MFA_TOTP');
const { connection } = require('../config/db');
const { sendResetEmail } = require('../utils/FORGOT_PASSWORD');

exports.registerInitiate = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  console.log("Register endpoint hit");
  const { firstName, lastName, email, password, phoneNumber, roleId } = req.body;

  // Check if email or phone number already exists
  const query = `SELECT * FROM Users WHERE Email = ? OR Phone_Number = ?`;
  connection.execute({
    sqlText: query,
    binds: [email, phoneNumber],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed to execute statement due to the following error: ' + err.message);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      
      if (rows.length > 0) {
        const existingEmail = rows[0].EMAIL === email;
        const existingPhone = rows[0].PHONE_NUMBER === phoneNumber;

        if (existingEmail && existingPhone) {
          return res.status(400).json({ success: false, message: 'Email and Phone number already exist' });
        } else if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        } else if (existingPhone) {
          return res.status(400).json({ success: false, message: 'Phone number already exists' });
        }
      }

      // Send verification email
      const sent_email = MFA.SEND_TOTP(email, undefined);
      if (sent_email) {
        return res.status(200).json({ success: true, message: 'Verification code sent, please check your email.' });
      } else {
        console.error("Failed to initiate registration:", err);
        return res.status(500).json({ success: false, message: 'Failed to send verification code.', error: err.message });
      }
    }
  });
};

function registerUser (req, res, secret) {
  const { firstName, lastName, email, password, phoneNumber, roleId } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  console.log("Data processed for query");
  const query = `INSERT INTO Users (First_Name, Last_Name, Email, Password_Hash, Password_Salt, Phone_Number, Role_ID, TOTP_SECRET) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  console.log("Executing INSERT query...");
  connection.execute({
    sqlText: query,
    binds: [firstName, lastName, email, passwordHash, salt, phoneNumber, roleId, secret],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed to execute statement due to the following error: ' + err.message);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      console.log("INSERT query executed successfully", rows);
      return res.status(201).json({ success: true, message: 'User registered successfully' });
    }
  });
}

exports.verifyAndCompleteRegistration = async (req, res) => {
  const email = req.body.email;
  const token = req.body.token;

  if (!email || !token) {
    return res.status(400).json({ success: false, message: 'Email and token are required.' });
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM TOTP WHERE Email = ?`;
      connection.execute({
        sqlText: query,
        binds: [email],
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      });
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No secret found for the provided email.' });
    }

    const secret = rows[0].TOTP_SECRET;

    console.log(`token submitted: ${token}`);
    console.log(`secret retrieved: ${secret}`);
    
    const verified = MFA.VERIFY_TOTP(token, secret);

    console.log(`Verification result: ${verified}`);

    if (verified) {
      // Proceed to insert user data into the database
      registerUser(req, res, secret);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
  } catch (error) {
    console.error("Error during verification:", error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.initLogin = (req, res) => {
  console.log("Login endpoint hit");
  const { email, password } = req.body;
  const query = `SELECT * FROM Users WHERE Email = ?`;

  console.log("Executing SELECT query...");
  connection.execute({
    sqlText: query,
    binds: [email],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed to execute statement due to the following error: ' + err.message);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = rows[0];
      console.log("User found:", user);

      const isPasswordValid = bcrypt.compareSync(password, user.PASSWORD_HASH);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const sent_email = MFA.login_SEND_TOTP(email, user.TOTP_SECRET);

      if (sent_email) {
        return res.status(200).json({ success: true, message: 'Verification code sent, please check your email.' });
      } else {
        console.error("Failed to initiate registration:", error);
        return res.status(500).json({ success: false, message: 'Failed to send verification code.', error: error.message });
      }
    }
  });
};

exports.verifyAndCompletelogin = async (req, res) => {
  const token = req.body.token;
  const { email, password } = req.body;
  if (!email || !token) {
    return res.status(400).json({ success: false, message: 'Email and token are required.' });
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM Users WHERE Email = ?`;
      connection.execute({
        sqlText: query,
        binds: [email],
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      });
    });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const secret = rows[0].TOTP_SECRET;

    console.log(`token submitted: ${token}`);
    console.log(`secret retrieved: ${secret}`);
    
    const verified = MFA.VERIFY_TOTP(token, secret);

    console.log(`Verification result: ${verified}`);

    if (verified) {
      console.log("Executing SELECT query...");
      const query = `SELECT * FROM Users WHERE Email = ?`;
      connection.execute({
        sqlText: query,
        binds: [email],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Failed to execute statement due to the following error: ' + err.message);
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
          }
          if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
          }

          const user = rows[0];
          console.log("User found:", user);

          const isPasswordValid = bcrypt.compareSync(password, user.PASSWORD_HASH);
          if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
          }

          const token = jwtUtil.generateToken(user);
          return res.status(200).json({ success: true, token });
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
  } catch (error) {
    console.error("Error during verification:", error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const query = `SELECT * FROM Users WHERE Email = ?`;
  connection.execute({
    sqlText: query,
    binds: [email],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed to execute statement due to the following error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = rows[0];
      console.log('User found:', user); // Log the user details
      const resetToken = jwtUtil.generateResetToken({ email: user.EMAIL });

      // Generate reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // Use the utility function to send the reset email
      sendResetEmail(email, resetLink).then(() => {
        return res.status(200).json({ success: true, message: 'Password reset email sent, please check your email.' });
      }).catch(error => {
        console.error('Error sending reset email:', error);
        return res.status(500).json({ success: false, message: 'Failed to send reset email.', error: error.message });
      });
    }
  });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  }

  try {
    const decoded = jwtUtil.verifyResetToken(token);
    console.log('Decoded token:', decoded);  // Log the decoded token

    if (!decoded || !decoded.email) {
      throw new Error('Invalid token');
    }

    const email = decoded.email;
    console.log('Email from token:', email);  // Log the email extracted from the token

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const query = `UPDATE Users SET Password_Hash = ?, Password_Salt = ? WHERE Email = ?`;
    connection.execute({
      sqlText: query,
      binds: [passwordHash, salt, email],
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement due to the following error:', err.message);
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
      }
    });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


