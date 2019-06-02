const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a User object.
 */
const UserSchema = {
  name: { required: true },
  address: { required: true }
  //fill in the rest
};
exports.UserSchema = UserSchema;


/*
 * Executes a MySQL query to fetch the total number of Users.  Returns
 * a Promise that resolves to this count.
 */
function getUsersCount() {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM Users',
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      }
    );
  });
}

/*
 * Executes a MySQL query to return a single page of Users.  Returns a
 * Promise that resolves to an array containing the fetched page of Users.
 */
function getUsersPage(page) {
  return new Promise(async (resolve, reject) => {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
     const count = await getUsersCount();
     const pageSize = 10;
     const lastPage = Math.ceil(count / pageSize);
     page = page > lastPage ? lastPage : page;
     page = page < 1 ? 1 : page;
     const offset = (page - 1) * pageSize;

    mysqlPool.query(
      'SELECT * FROM Users ORDER BY id LIMIT ?,?',
      [ offset, pageSize ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            Users: results,
            page: page,
            totalPages: lastPage,
            pageSize: pageSize,
            count: count
          });
        }
      }
    );
  });
}
exports.getUsersPage = getUsersPage;

/*
 * Executes a MySQL query to insert a new User into the database.  Returns
 * a Promise that resolves to the ID of the newly-created User entry.
 */
function insertNewUser(User) {
  return new Promise((resolve, reject) => {
    User = extractValidFields(User, UserSchema);
    User.id = null;
    mysqlPool.query(
      'INSERT INTO Users SET ?',
      User,
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      }
    );
  });
}
exports.insertNewUser = insertNewUser;

/*
 * Executes a MySQL query to fetch information about a single specified
 * User based on its ID.  Does not fetch photo and review data for the
 * User.  Returns a Promise that resolves to an object containing
 * information about the requested User.  If no User with the
 * specified ID exists, the returned Promise will resolve to null.
 */
function getUserById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Users WHERE id = ?',
      [ id ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      }
    );
  });
}

/*
 * Executes a MySQL query to fetch detailed information about a single
 * specified User based on its ID, including photo and review data for
 * the User.  Returns a Promise that resolves to an object containing
 * information about the requested User.  If no User with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getUserDetailsById(id) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified User, including its reviews and photos.
   */
  const User = await getUserById(id);
  if (User) {
    User.reviews = await getReviewsByUserId(id);
    User.photos = await getPhotosByUserId(id);
  }
  return User;
}
exports.getUserDetailsById = getUserDetailsById;

/*
 * Executes a MySQL query to replace a specified User with new data.
 * Returns a Promise that resolves to true if the User specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
function replaceUserById(id, User) {
  return new Promise((resolve, reject) => {
    User = extractValidFields(User, UserSchema);
    mysqlPool.query(
      'UPDATE Users SET ? WHERE id = ?',
      [ User, id ],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.affectedRows > 0);
        }
      }
    );
  });
}
exports.replaceUserById = replaceUserById;

/*
 * Executes a MySQL query to delete a User specified by its ID.  Returns
 * a Promise that resolves to true if the User specified by `id` existed
 * and was successfully deleted or to false otherwise.
 */
function deleteUserById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'DELETE FROM Users WHERE id = ?',
      [ id ],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.affectedRows > 0);
        }
      }
    );
  });
}
exports.deleteUserById = deleteUserById;

/*
 * Executes a MySQL query to fetch all Users owned by a specified User,
 * based on on the User's ID.  Returns a Promise that resolves to an array
 * containing the requested Users.  This array could be empty if the
 * specified User does not own any Users.  This function does not verify
 * that the specified User ID corresponds to a valid User.
 */
function getUsersByOwnerId(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Users WHERE ownerid = ?',
      [ id ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}
exports.getUsersByOwnerId = getUsersByOwnerId;


//finds out whether a user has admin privileges or not
function getAdmin(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT admin FROM users WHERE id = ?',
      [ id ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log(results[0])
          result = results[0];
          if (result == "true") result = 1;
          if (result == "false") result = 0;
          console.log(result);
          resolve(result);
        }
      }
    );
  });
}
exports.getAdmin = getAdmin;

//validates user password matches the one they provided
async function validateUser (id, password) {
  const user = await getUserById(id);
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
}
exports.validateUser = validateUser;