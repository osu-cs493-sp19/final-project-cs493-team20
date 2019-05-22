const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { function1, function2} = require('../models/assignments');
const { validateAgainstSchema } = require('../lib/validation');



/*
 * Create a new Assignment.
 *
 * Create and store a new Assignment with specified data and adds it to the application's database.  Only an authenticated User 
 * with 'admin' role or an authenticated 'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can create an Assignment.
 */
router.post('/', requireAuthentication, async (req, res) => {
  
});


/*
 * Fetch data about a specific Assignment.
 *
 *  Returns summary data about the Assignment, excluding the list of Submissions.
 */
router.get('/:id', async (req, res) => {
  
});


//We have not worked with a patch request before so I commented this out. I'm not sure if we should create this or not.
//router.patch('/:id', async (req, res) => {
//});


/*
 * Remove a specific Assignment from the database.
 *
 *  Completely removes the data for the specified Assignment, including all submissions.  Only an authenticated User with 'admin' role or an authenticated
 *  'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can delete an Assignment.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  
});


/*
 * Fetch the list of all Submissions for an Assignment.
 *
 *  Returns the list of all Submissions for an Assignment.  This list should be paginated.  Only an authenticated User with 'admin' role or an authenticated
 *  'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can fetch the Submissions for an Assignment.
 */
router.get('/:id/submissions', async (req, res, next) => {
  
});


/*
 * Create a new Submission for an Assignment.
 *
 *  Create and store a new Assignment with specified data and adds it to the application's database.  Only an authenticated User with 'student' role 
 *  who is enrolled in the Course corresponding to the Assignment's `courseId` can create a Submission.
 */
router.post('/:id/submissions', requireAuthentication, async (req, res) => {
  
});


/*
 * Route to replace data for a business.
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
  
});

/*
 * Route to delete a business.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  
});

module.exports = router;
