const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');


/*
 * Schema describing required/optional fields of a course object.
 */
const courseSchema = {
  name: { required: true },
  address: { required: true },
  //fill in the rest
};
exports.courseSchema = courseSchema;


/*
 * Executes a MySQL query to fetch the total number of Courses.  Returns
 * a Promise that resolves to this count.
 */
function getCoursesCount() {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM Courses',
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
 * Executes a MySQL query to return a single page of Courses.  Returns a
 * Promise that resolves to an array containing the fetched page of Courses.
 */
function getCoursesPage(page) {
  return new Promise(async (resolve, reject) => {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
     const count = await getCoursesCount();
     const pageSize = 10;
     const lastPage = Math.ceil(count / pageSize);
     page = page > lastPage ? lastPage : page;
     page = page < 1 ? 1 : page;
     const offset = (page - 1) * pageSize;

    mysqlPool.query(
      'SELECT * FROM Courses ORDER BY id LIMIT ?,?',
      [ offset, pageSize ],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            Courses: results,
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
exports.getCoursesPage = getCoursesPage;

/*
 * Executes a MySQL query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
function insertNewcourse(course) {
  return new Promise((resolve, reject) => {
    course = extractValidFields(course, courseSchema);
    course.id = null;
    mysqlPool.query(
      'INSERT INTO Courses SET ?',
      course,
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
exports.insertNewcourse = insertNewcourse;

/*
 * Executes a MySQL query to fetch information about a single specified
 * course based on its ID.  Does not fetch photo and review data for the
 * course.  Returns a Promise that resolves to an object containing
 * information about the requested course.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 */
function getcourseById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Courses WHERE id = ?',
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
 * specified course based on its ID, including photo and review data for
 * the course.  Returns a Promise that resolves to an object containing
 * information about the requested course.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getcourseDetailsById(id) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified course, including its reviews and photos.
   */
  const course = await getcourseById(id);
  if (course) {
    course.reviews = await getReviewsBycourseId(id);
    course.photos = await getPhotosBycourseId(id);
  }
  return course;
}
exports.getcourseDetailsById = getcourseDetailsById;

/*
 * Executes a MySQL query to replace a specified course with new data.
 * Returns a Promise that resolves to true if the course specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
function replacecourseById(id, course) {
  return new Promise((resolve, reject) => {
    course = extractValidFields(course, courseSchema);
    mysqlPool.query(
      'UPDATE Courses SET ? WHERE id = ?',
      [ course, id ],
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
exports.replacecourseById = replacecourseById;

/*
 * Executes a MySQL query to delete a course specified by its ID.  Returns
 * a Promise that resolves to true if the course specified by `id` existed
 * and was successfully deleted or to false otherwise.
 */
function deletecourseById(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'DELETE FROM Courses WHERE id = ?',
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
exports.deletecourseById = deletecourseById;

/*
 * Executes a MySQL query to fetch all Courses owned by a specified user,
 * based on on the user's ID.  Returns a Promise that resolves to an array
 * containing the requested Courses.  This array could be empty if the
 * specified user does not own any Courses.  This function does not verify
 * that the specified user ID corresponds to a valid user.
 */
function getCoursesByOwnerId(id) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM Courses WHERE ownerid = ?',
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
exports.getCoursesByOwnerId = getCoursesByOwnerId;
