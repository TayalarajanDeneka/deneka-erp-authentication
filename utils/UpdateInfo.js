const { connection } = require('../config/db');

const update_check = async (userId, category, newInfo) => {
    // Check if the userId exists
    const userExists = await checkUserIdExists(userId);
    if (!userExists) {
      throw new Error('User ID does not exist.');
    }
  
    // Validate the new info based on the category
    switch (category.toLowerCase()) {
      case 'first_name':
      case 'last_name':
        if (!/^[a-zA-Z]+$/.test(newInfo)) {
          throw new Error(`${category} must only contain alphabetic characters.`);
        }
        break;
      case 'phone_number':
        if (!/^\+61[ ]?\(0\)?[ ]?\d{1,4}[ ]?\d{1,4}[ ]?\d{0,4}$/.test(newInfo)) {
          throw new Error('Phone number must be in valid Australian format.');
        }
        break;
      default:
        throw new Error('Invalid category for update.');
    }
  
    // If all checks pass, you can update the user information
    // This could be something like: await updateUser(userId, category, newInfo);
    console.log('Validation passed. Ready to update.');
  };
  
  const checkUserIdExists = (userId, callback) => {
    const query = 'SELECT COUNT(*) AS count FROM Users WHERE User_ID = ?';
    connection.execute({
      sqlText: query,
      binds: [userId],
      complete: (err, stmt, rows) => {
        if (err) {
          // If there's an error during the query, pass it to the callback
          callback('Failed to check user ID due to the following error: ' + err.message, null);
        } else {
          // Assuming rows contain the results and rows[0].count is the number of users found
          if (rows[0].count > 0) {
            // If the count is more than 0, the user exists
            callback(null, true);
          } else {
            // No users found with that ID
            callback(null, false);
          }
        }
      }
    });
  };

const updateRecord = (userId, category, newInfo, callback) => {
    const updateQuery = `UPDATE Users SET ${category} = ? WHERE User_ID = ?`;
    connection.execute({
      sqlText: updateQuery,
      binds: [newInfo, userId],
      complete: (err, stmt) => {
        if (err) {
          callback('Failed to update user info due to the following error: ' + err.message, null);
        } else {
          callback(null, 'User info updated successfully.');
        }
      }
    });
  };