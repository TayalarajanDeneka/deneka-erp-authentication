const snowflake = require('snowflake-sdk');

const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
};

const connection = snowflake.createConnection(connectionOptions);

const connectDB = () => {
  connection.connect((err, conn) => {
    if (err) {
      console.error('Unable to connect to Snowflake: ' + err.message);
    } else {
      console.log('Successfully connected to Snowflake.');
    }
  });
};

module.exports = {
  connection,
  connectDB
};
