const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const { function1, function2} = require('../models/courses');


/*
 * Fetch the list of all Courses.
 *
 * Returns the list of all Courses.  This list should be paginated.  The Courses returned should not contain the list of students in the Course or the list of Assignments for the Course.
 */
router.get('/', async (req, res, next) => {
 
});


/*
 * Create a new course.
 *
 * Creates a new Course with specified data and adds it to the application's database.  Only an authenticated User with 'admin' role can create a new Course.
 */
router.post('/', requireAuthentication, async (req, res) => {
  

});

/*
 * Fetch data about a specific Course.
 *
 * Returns summary data about the Course, excluding the list of students enrolled in the course and the list of Assignments for the course.
 */
router.get('/:id', async (req, res, next) => {
 
});


/*
 * Remove a specific Course from the database.
 *
 * Completely removes the data for the specified Course, including all enrolled students, all Assignments, etc.  Only an authenticated User with 'admin' role can remove a Course.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  
});


/*
 * Fetch a list of the students enrolled in the Course.
 *
 *  Returns a list containing the User IDs of all students currently enrolled in the Course.  Only an authenticated User with 'admin' role or an 
 *  authenticated 'instructor' User whose ID matches the `instructorId` of the Course can fetch the list of enrolled students.
 */
router.get('/:id/students', async (req, res, next) => {
 
});


/*
 * Update enrollment for a Course.
 *
 * Enrolls and/or unenrolls students from a Course.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose 
 * ID matches the `instructorId` of the Course can update the students enrolled in the Course.
 */
router.post('/:id/students', requireAuthentication, async (req, res) => {
  
});


/*
 * Fetch a CSV file containing list of the students enrolled in the Course.
 *
 *  Returns a CSV file containing information about all of the students currently enrolled in the Course, including names, IDs, 
 *  and email addresses.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the `instructorId` of the Course can fetch the course roster.
 */
router.get('/:id/roster', async (req, res, next) => {
 
});


/*
 * Fetch a list of the Assignments for the Course.
 *
 *  Returns a list containing the Assignment IDs of all Assignments for the Course.
 */
router.get('/:id/assignments', async (req, res, next) => {
 
});

module.exports = router;
