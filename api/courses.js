const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
    courseSchema,
    studentSchema,
    getCoursesPage,
    insertNewCourse,
    getCourseDetailsById,
    getCourseById,
    replaceCourseById,
    getStudentsInCourse,
    replaceStudentInCourse,    
    getStudentsInCourseCSV,
    getAssignmentsByCourseID,
    deleteCourseById,
    getCoursesByOwnerdId
  } = require('../models/courses');


/*
 * Fetch the list of all Courses.
 *
 * Returns the list of all Courses.  This list should be paginated.  The Courses returned should not contain the list of students in the Course or the list of Assignments for the Course.
 */
router.get('/', async (req, res, next) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const coursePage = await getCoursesPage(parseInt(req.query.page) || 1);
        coursePage.links = {};
        if (coursePage.page < coursePage.totalPages) {
          coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
          coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
        }
        if (coursePage.page > 1) {
          coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
          coursePage.links.firstPage = '/courses?page=1';
        }
        res.status(200).send(coursePage);
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error fetching courses list.  Please try again later."
        });
      }
});


/*
 * Create a new course.
 *
 * Creates a new Course with specified data and adds it to the application's database.  Only an authenticated User with 'admin' role can create a new Course.
 */
router.post('/', requireAuthentication, async (req, res) => {
    if (req.role == 2) {
        if (validateAgainstSchema(req.body, courseSchema)) {
          try {
            const id = await insertNewCourse(req.body);
            res.status(201).send({
              id: id,
              links: {
                course: `/courses/${id}`
              }
            });
          } catch (err) {
            console.error(err);
            res.status(500).send({
              error: "Error inserting course into DB.  Please try again later."
            });
          }
        } else {
          res.status(400).send({
            error: "Request body is not a valid course object."
          });
        }
    } else {
      res.status(403).send({
        error: "Unauthorized to access the specified resource"
      });
    }

});

/*
 * Fetch data about a specific Course.
 *
 * Returns summary data about the Course, excluding the list of students enrolled in the course and the list of Assignments for the course.
 */
router.get('/:id', async (req, res, next) => {
	console.log(req.params.id)
    try {
    	console.log("inside try")
        const course = await getCourseById(parseInt(req.params.id));
        if (course) {
          res.status(200).send(course);
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch course.  Please try again later."
        });
      }
});


/*
 * Remove a specific Course from the database.
 *
 * Completely removes the data for the specified Course, including all enrolled students, all Assignments, etc.  Only an authenticated User with 'admin' role can remove a Course.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
    if (req.role == 2) {
        try {
          const deleteSuccessful = await deleteCourseById(parseInt(req.params.id));
          if (deleteSuccessful) {
            res.status(204).end();
          } else {
            next();
          }
        } catch (err) {
          console.error(err);
          res.status(500).send({
            error: "Unable to delete course.  Please try again later."
          });
        }
    } else {
      res.status(403).send({
        error: "Unauthorized to access the specified resource"
      });
    }
});


/*
 * Fetch a list of the students enrolled in the Course.
 *
 *  Returns a list containing the User IDs of all students currently enrolled in the Course.  Only an authenticated User with 'admin' role or an 
 *  authenticated 'instructor' User whose ID matches the `instructorId` of the Course can fetch the list of enrolled students.
 */
router.get('/:id/students', requireAuthentication, async (req, res, next) => {
    try {
		const courseInfo = await getCourseById(req.params.id);
        const course = await getStudentsInCourse(parseInt(req.params.id));
		if(req.role == 2 || (req.role == 1 && req.user == courseInfo.instructorId)){
			if (course) {
			  res.status(200).send(course);
			} else {
			  next();
			}
		} else{
			res.status(403).send({
				error: "User is not authenticated to be able to access the list of enrolled students"
			});
		}
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch course.  Please try again later."
        });
      }
});


/*
 * Update enrollment for a Course.
 *
 * Enrolls and/or unenrolls students from a Course.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose 
 * ID matches the `instructorId` of the Course can update the students enrolled in the Course.
 */
router.post('/:id/students/:flag', requireAuthentication, async (req, res) => {
	if (validateAgainstSchema(req.body, studentSchema)) {
	  try {
		const id = parseInt(req.params.id);
		const courseInfo = await getCourseById(req.params.id);
		if(req.role == 2 || (req.role == 1 && req.user == courseInfo.instructorId)){
			//flag is set for 0 when unenrolling student, 1 when updating student, 2 when creating new student
			console.log("posting student")
			const flag = parseInt(req.params.flag);
			const updateSuccessful = await replaceStudentInCourse(id, req.body, flag);
			console.log("updateSuccess:")
			console.log(updateSuccessful)
			if (updateSuccessful) {
			  res.status(200).send({
				links: {
				  course: `/courses/${id}`
				}
			  });
			} else {
			  next();
			}
		} else {
			res.status(403).send({
				error: "User is unauthorized to make changes to enrollment. Must be admin or teacher that is teaching the class"
			});
		}
	  } catch (err) {
		console.error(err);
		res.status(500).send({
		  error: "Unable to update specified enrollment.  Please try again later."
		});
	  }
	} else {
	  res.status(400).send({
		error: "Request body is not a valid enrollment object"
	  });
	}

});


/*
 * Fetch a CSV file containing list of the students enrolled in the Course.
 *
 *  Returns a CSV file containing information about all of the students currently enrolled in the Course, including names, IDs, 
 *  and email addresses.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the `instructorId` of the Course can fetch the course roster.
 */
router.get('/:id/rosters', requireAuthentication, async (req, res, next) => {
	console.log("in roster")
    try {
		const courseInfo = await getCourseById(req.params.id);
		if(req.role == 2 || (req.role == 1 && req.user == courseInfo.instructorId)){
			console.log("getting students")
			const course = await getStudentsInCourseCSV(parseInt(req.params.id));
			if (course) {
				res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'download-' + Date.now() + '.csv\"');
				res.set('Content-Type', 'text/csv');
				res.status(200).send(course)
			  
			} else {
			  next();
			}
		} else {
			res.status(403).send({
				error: "User is unauthorized to fetch the course roster"
			})
		}
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch CSV List of students for course.  Please try again later."
        });
      }
});


/*
 * Fetch a list of the Assignments for the Course.
 *
 *  Returns a list containing the Assignment IDs of all Assignments for the Course.
 */
router.get('/:id/assignments', async (req, res, next) => {
    try {
        const course = await getAssignmentsByCourseID(parseInt(req.params.id));
        if (course) {
          res.status(200).send(course);
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch list of assignments.  Please try again later."
        });
      }
});

module.exports = router;
