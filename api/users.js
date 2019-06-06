
const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const { UserSchema, insertNewUser, getUserById, validateUser, getUserByEmail } = require('../models/users');



/*
 * Create a new User.
 *
 * Create and store a new application User with specified data and adds it to the application's database.  Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
 */
router.post('/', requireAuthentication, async (req, res) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
		if((req.body.role == 1 || req.body.role == 2) && req.role != 2){
			res.status(403).send({
				error: "The request was not made by an authenticated User of the admin role."
			});
		}else {
			try {
			  const id = await insertNewUser(req.body);
			  res.status(201).send({
				_id: id
			  });
			} catch (err) {
			  console.error("  -- Error:", err);
			  res.status(500).send({
				error: "Error inserting new user.  Try again later."
			  });
			}
		}
    } else {
		res.status(400).send({
          error: "Request body does not contain a valid User."
        });
    }
});

/*
 * Log in a User.
 *
 * Authenticate a specific User with their email address and password.
 */
router.post('/login', async (req, res) => {
    if (req.body && req.body.email && req.body.password) {
        try {
          const authenticated = await validateUser(req.body.email, req.body.password);
          if (authenticated) {
			const user = await getUserByEmail(req.body.email);
            const token = await generateAuthToken(req.body.email, user.role);
            res.status(200).send({
              token: token
            });
          } else {
            res.status(401).send({
              error: "Invalid credentials"
            });
          }
        } catch (err) {
			console.log(err)
          res.status(500).send({
            error: "Error validating user.  Try again later."
          });
        }
      } else {
        res.status(400).send({
          error: "Request body was invalid"
        });
      }
});

/*
 * Fetch data about a specific User.
 * Returns information about the specified User.  If the User has the 'instructor' role, the response should include a list of the IDs of the Courses the User teaches (i.e. Courses whose `instructorId` field matches the ID of this User).  
 * If the User has the 'student' role, the response should include a list of the IDs of the Courses the User is enrolled in.  Only an authenticated User whose ID matches the ID of the requested User can fetch this information.
 */
router.get('/:id', requireAuthentication, async (req, res) => {
    if (req.params.id == req.user) {
        try {
          const user = await getUserById(req.params.id);
          if (user) {
            res.status(200).send(user);
          } else {
            next();
          }
        } catch (err) {
          console.error("  -- Error:", err);
          res.status(500).send({
            error: "Error fetching user.  Try again later."
          });
        }
      } else {
        res.status(403).send({
          error: "Unauthorized to access the specified resource"
        });
      }
});





module.exports = router;
