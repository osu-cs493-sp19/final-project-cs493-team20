const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');


/*
 * Schema describing required/optional fields of a Assignment object.
 */
const AssignmentSchema = {
  name: { required: true },
  address: { required: true },
  //fill in the rest
};
exports.AssignmentSchema = AssignmentSchema;

/*
 * Schema describing required/optional fields of a Submission object.
 */
const SubmissionSchema = {
  name: { required: true },
  address: { required: true },
  //fill in the rest
};
exports.SubmissionSchema = SubmissionSchema;


/*
 * Executes a MySQL query to fetch the total number of Assignments.  Returns
 * a Promise that resolves to this count.
 */
function getAssignmentsCount() {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM Assignments',
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
 * Executes a MySQL query to return a single page of Assignments.  Returns a
 * Promise that resolves to an array containing the fetched page of Assignments.
 */
function getAssignmentsPage(page) {
  return new Promise(async (resolve, reject) => {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
     const count = await getAssignmentsCount();
     const pageSize = 10;
     const lastPage = Math.ceil(count / pageSize);
     page = page > lastPage ? lastPage : page;
     page = page < 1 ? 1 : page;
     const offset = (page - 1) * pageSize;

    mysqlPool.query(
      'SELECT * FROM Assignments ORDER BY id LIMIT ?,?',
      [ offset, pageSize ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            Assignments: results,
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
exports.getAssignmentsPage = getAssignmentsPage;

/*
 * Executes a MySQL query to insert a new Assignment into the database.  Returns
 * a Promise that resolves to the ID of the newly-created Assignment entry.
 */
function insertNewAssignment(Assignment) {
  return new Promise((resolve, reject) => {
    Assignment = extractValidFields(Assignment, AssignmentSchema);
    Assignment.id = null;
    mysqlPool.query(
      'INSERT INTO Assignments SET ?',
      Assignment,
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
exports.insertNewAssignment = insertNewAssignment;

/*
 * Executes a MySQL query to fetch information about a single specified
 * Assignment based on its ID.  Does not fetch photo and review data for the
 * Assignment.  Returns a Promise that resolves to an object containing
 * information about the requested Assignment.  If no Assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
function getAssignmentById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Assignments WHERE id = ?',
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
///////////////////////////////////FIX/////////////////////////////////////////////////////////
/*
 * Executes a MySQL query to fetch detailed information about a single
 * specified Assignment based on its ID, including photo and review data for
 * the Assignment.  Returns a Promise that resolves to an object containing
 * information about the requested Assignment.  If no Assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getAssignmentDetailsById(id) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified Assignment, including its reviews and photos.
   */
  const Assignment = await getAssignmentById(id);
  if (Assignment) {
    Assignment.reviews = await getReviewsByAssignmentId(id);
    Assignment.photos = await getPhotosByAssignmentId(id);
  }
  return Assignment;
}
exports.getAssignmentDetailsById = getAssignmentDetailsById;

/////////////////////////////////////////////////////////////////////////////////////////////////////
/*
 * Executes a MySQL query to replace a specified Assignment with new data.
 * Returns a Promise that resolves to true if the Assignment specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
function replaceAssignmentById(id, Assignment) {
  return new Promise((resolve, reject) => {
    Assignment = extractValidFields(Assignment, AssignmentSchema);
    mysqlPool.query(
      'UPDATE Assignments SET ? WHERE id = ?',
      [ Assignment, id ],
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
exports.replaceAssignmentById = replaceAssignmentById;

/*
 * Executes a MySQL query to delete a Assignment specified by its ID.  Returns
 * a Promise that resolves to true if the Assignment specified by `id` existed
 * and was successfully deleted or to false otherwise.
 */
function deleteAssignmentById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'DELETE FROM Assignments WHERE id = ?',
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
exports.deleteAssignmentById = deleteAssignmentById;

/*
 * Executes a MySQL query to fetch all Assignments owned by a specified user,
 * based on on the user's ID.  Returns a Promise that resolves to an array
 * containing the requested Assignments.  This array could be empty if the
 * specified user does not own any Assignments.  This function does not verify
 * that the specified user ID corresponds to a valid user.
 */
function getAssignmentsByOwnerId(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Assignments WHERE ownerid = ?',
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
exports.getAssignmentsByOwnerId = getAssignmentsByOwnerId;

function getSubmissionsPage(page) {
  return new Promise(async (resolve, reject) => {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
     const count = await getAssignmentsCount();
     const pageSize = 10;
     const lastPage = Math.ceil(count / pageSize);
     page = page > lastPage ? lastPage : page;
     page = page < 1 ? 1 : page;
     const offset = (page - 1) * pageSize;

    mysqlPool.query(
      'SELECT * FROM Submissions ORDER BY id LIMIT ?,?',
      [ offset, pageSize ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            Assignments: results,
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
exports.getSubmissionsPage = getSubmissionsPage;

function insertNewSubmission(Submission){
  return new Promise((resolve, reject) => {
    Assignment = extractValidFields(Submission, SubmissionSchema);
    Submission.id = null;
    mysqlPool.query(
      'INSERT INTO Submissions SET ?',
      Submission,
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
exports.insertNewSubmission = insertNewSubmission;
