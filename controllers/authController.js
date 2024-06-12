const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwtUtil');
const { connection } = require('../config/db');

exports.register = (req, res) => {
  console.log("Register endpoint hit");
  const { firstName, lastName, email, password, phoneNumber, roleId } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  console.log("Data processed for query");
  const query = `INSERT INTO Users (First_Name, Last_Name, Email, Password_Hash, Password_Salt, Phone_Number, Role_ID) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  console.log("Executing INSERT query...");
  connection.execute({
    sqlText: query,
    binds: [firstName, lastName, email, passwordHash, salt, phoneNumber, roleId],
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

exports.login = (req, res) => {
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

        const token = jwtUtil.generateToken(user);
        res.status(200).json({ token });
      }
    }
  });
};

