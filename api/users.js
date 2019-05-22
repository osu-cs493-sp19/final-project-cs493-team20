
const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');

const { validateAgainstSchema } = require('../lib/validation');



/*
 * Create a new User.
 *
 * Create and store a new application User with specified data and adds it to the application's database.  Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
 */
router.post('/', requireAuthentication, async (req, res) => {
  
});

/*
 * Log in a User.
 *
 * Authenticate a specific User with their email address and password.
 */
router.post('/login', requireAuthentication, async (req, res) => {
  
});

/*
 * Fetch data about a specific User.
 * Returns information about the specified User.  If the User has the 'instructor' role, the response should include a list of the IDs of the Courses the User teaches (i.e. Courses whose `instructorId` field matches the ID of this User).  
 * If the User has the 'student' role, the response should include a list of the IDs of the Courses the User is enrolled in.  Only an authenticated User whose ID matches the ID of the requested User can fetch this information.
 */
router.get('/:id', async (req, res) => {
  
});





module.exports = router;
