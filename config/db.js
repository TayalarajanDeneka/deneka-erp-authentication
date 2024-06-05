const snowflake = require('snowflake-sdk');

// Create the connection pool instance
const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
};

// Create a single connection (instead of a pool)
const connection = snowflake.createConnection(connectionOptions);

const connectDB = () => {
  connection.connect((err, conn) => {
    if (err) {
      console.error('Unable to connect: ' + err.message);
    } else {
      console.log('Successfully connected to Snowflake.');
    }
  });
};

module.exports = {
  connection,
  connectDB
};
