const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwtUtil');
const MFA = require('../utils/MFA_TOTP');
const speakeasy = require('speakeasy');
const { connection } = require('../config/db');


exports.registerInitiate = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  console.log("Register endpoint hit");
  const { firstName, lastName, email, password, phoneNumber, roleId } = req.body;

  const sent_email = MFA.SEND_TOTP(email, undefined);

  if (sent_email){
    res.status(200).json({ message: 'Verification code sent, please check your email.'});
  } else{
    console.error("Failed to initiate registration:", error);
    res.status(500).json({ message: 'Failed to send verification code.', error: error });
  }
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
        res.status(500).json({ message: 'Database error', error: err });
      } else {
        console.log("INSERT query executed successfully", rows);
        res.status(201).json({ message: 'User registered successfully' });
      }
    }
  });
};

exports.verifyAndCompleteRegistration = async (req, res) => {
  const email = req.body.email;
  const token = req.body.token;

  if (!email || !token) {
      res.status(400).json({ message: 'Email and token are required.' });
      return;
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
          res.status(404).json({ message: 'No secret found for the provided email.' });
          return;
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
          res.status(400).json({ message: 'Invalid verification code.' });
      }
  } catch (error) {
      console.error("Error during verification:", error);
      res.status(500).json({ message: 'Internal server error' });
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
        res.status(500).json({ message: 'Database error', error: err });
      } else {
        console.log("SELECT query executed successfully", rows);
        if (rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        console.log("User found:", user);

        const isPasswordValid = bcrypt.compareSync(password, user.PASSWORD_HASH);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid password' });
        }
        

        const sent_email = MFA.login_SEND_TOTP(email, user.TOTP_SECRET);

        if (sent_email){
          res.status(200).json({ message: 'Verification code sent, please check your email.'});
        } else{
          console.error("Failed to initiate registration:", error);
          res.status(500).json({ message: 'Failed to send verification code.', error: error });
        }
      }
    }
  });
};

exports.verifyAndCompletelogin = async (req, res) => {
  const token = req.body.token;
  const { email, password } = req.body;
  if (!email || !token) {
      res.status(400).json({ message: 'Email and token are required.' });
      return;
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
          res.status(404).json({ message: 'No secret found for the provided email.' });
          return;
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
              res.status(500).json({ message: 'Database error', error: err });
            } else {
              console.log("SELECT query executed successfully", rows);
              if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
              }
      
              const user = rows[0];
              console.log("User found:", user);
      
              const isPasswordValid = bcrypt.compareSync(password, user.PASSWORD_HASH);
              if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password' });
              }
      
              const token = jwtUtil.generateToken(user);
              res.status(200).json({ token });
            }
          }
        });
      } else {
          res.status(400).json({ message: 'Invalid verification code.' });
      }
  } catch (error) {
      console.error("Error during verification:", error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


