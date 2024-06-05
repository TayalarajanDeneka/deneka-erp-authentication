const { connection } = require('../config/db');

const login = async (req, res) => {
  const query = `SELECT * FROM USER`;

  connection.execute({
    sqlText: query,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed to execute statement due to the following error: ' + err.message);
        return res.status(500).send('Internal Server Error');
      }

      res.json(rows);
    }
  });
};

module.exports = { login };
