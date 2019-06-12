const router = require('express').Router();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
    AssignmentSchema,
    SubmissionSchema,    
    getAssignmentsPage,
    insertNewAssignment,
    getAssignmentById,
    getAssignmentDetailsById,
    replaceAssignmentById,
    deleteAssignmentById,
    getAssignmentesByOwnerdId,
    getSubmissionsPage,
	getSubmissionsPageByStudentId,
    insertNewSubmission,
	patchAssignmentById
  } = require('../models/assignments');
const { getCourseDetailsById, getStudentsInCourse, } = require('../models/courses');

const upload = multer({
  storage: multer.diskStorage({
	destination: `${__dirname}/uploads`,
	filename: (req, file, callback) => {
      const basename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = imageTypes[file.mimetype];
      callback(null, `${basename}.${extension}`);
	}
  }),
  fileFilter: (req, file, callback) => {
	  callback(null, !!imageTypes[file.mimetype])
  }
});

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'text/plain': 'txt'
};

/*
 * Create a new Submission for an Assignment.
 *
 *  Create and store a new Assignment with specified data and adds it to the application's database.  Only an authenticated User with 'student' role 
 *  who is enrolled in the Course corresponding to the Assignment's `courseId` can create a Submission.
 */
router.post('/:id/submissions', requireAuthentication, upload.single('file'), async (req, res) => {
	if (req.file && validateAgainstSchema(req.body, SubmissionSchema)) {
	  try {
		const assignment = await getAssignmentById(parseInt(req.params.id))
		var students = await getStudentsInCourse(assignment.courseId);
		console.log(req.user);
		if(students.includes(req.user) || req.user == 0){
			const submission = {
			  //contentType: req.file.mimetype,
			  file: req.file.filename,
			  url: `/assignments/media/submissions/${req.file.filename}`,
			  //path: req.file.path,
			  timestamp: Date.now(),
			  courseid: req.body.courseid,
			  studentid: req.body.studentid,
			  assignmentid: req.params.id
			};
			const id = await insertNewSubmission(submission);
			res.status(201).send({
			  id: id,
			  links: {
				assignment: `/assignments/media/submissions/${submission.file}`
			  }
			});
		} else {
			res.status(403).send({
				error: "User is not authorized to submit assignments for this course"
			})
		}
	  } catch (err) {
		console.error(err);
		res.status(500).send({
		  error: "Error inserting submission into DB.  Please try again later."
		});
	  }
	} else {
	  res.status(400).send({
		error: "Request body is not a valid submission object."
	  });
	}
});

/*
 * Create a new Assignment.
 *
 * Create and store a new Assignment with specified data and adds it to the application's database.  Only an authenticated User 
 * with 'admin' role or an authenticated 'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can create an Assignment.
 */
router.post('/', requireAuthentication, async (req, res) => {
	console.log("posting assignment:")
	console.log(req.body)
	if (validateAgainstSchema(req.body, AssignmentSchema)) {
		console.log("validated")
	  try {
		const course = await getCourseDetailsById(parseInt(req.body.courseId));  
		if(req.role == 2 || ( req.role == 1 && req.user == course.instructorId)){
			const id = await insertNewAssignment(req.body);
			res.status(201).send({
			  id: id,
			  links: {
				assignment: `/assignments/${id}`
			  }
			});
		  }else {
			  res.status(403).send({
				error: "User is not authenticated or user is not an admin or teacher that has an Id that matches that of the course."  
			  })
		  }
	  }
	  catch (err) {
		console.error(err);
		res.status(500).send({
		  error: "Error inserting assignment into DB.  Please try again later."
		});
	  }
	} else {
	  res.status(400).send({
		error: "Request body is not a valid assignment object."
	  });
	}
});


/*
 * Fetch data about a specific Assignment.
 *
 *  Returns summary data about the Assignment, excluding the list of Submissions.
 */
router.get('/:id', async (req, res) => {
    try {
        const assignment = await getAssignmentDetailsById(parseInt(req.params.id));
        if (assignment) {
          res.status(200).send(assignment);
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch assignment.  Please try again later."
        });
      }
});


//We have not worked with a patch request before so I commented this out. I'm not sure if we should create this or not. Please refer to .yaml
router.patch('/:id', requireAuthentication, async (req, res) => {
	try{
	const assignment = await getAssignmentById(parseInt(req.params.id))
		console.log(assignment);
	  //const course = await getCourseDetailsById(assignment.courseId);
	  //console.log(course);
	  
	  if(req.role == 2 || (req.role == 1 /*&& req.user == course.instructorId*/)){
		  console.log(req.body);
		  let obj = req.body;
		  let updateObj = {};
		  Object.keys(req.body).forEach((field) => {
			updateObj[field] = obj[field];
		  });
		  /*
		  var fieldsToUpdate = {};
		  for(const field of req.body){
			  fieldsToUpdate[field.name] = field.value;
		  }
		  */
		  //const updateObj = req.body;
		  const patch = await patchAssignmentById(req.params.id, updateObj);
		  if(patch){
			  res.status(200).send("Patch Success");
		  } else{
			  res.status(200).send("Patch Failed");
		  }
		  
	  } else {
		  res.status(403).send({
			error: "User is not authorized to patch this assignment"  
		  })
	  }
	  
	} catch (err) {
		console.error(err);
        res.status(500).send({
          error: "Unable to patch assignment.  Please try again later."
        });
	}
});


/*
 * Remove a specific Assignment from the database.
 *
 *  Completely removes the data for the specified Assignment, including all submissions.  Only an authenticated User with 'admin' role or an authenticated
 *  'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can delete an Assignment.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
	try {
	  const assignment = await getAssignmentById(parseInt(req.params.id))
	  const course = await getCourseDetailsById(assignment.courseId);
	  if( req.role == 2 || (req.role == 1 && req.user == course.instructorId)){
		  const deleteSuccessful = await deleteAssignmentById(parseInt(req.params.id));
		  if (deleteSuccessful) {
			res.status(204).send({
				err: "Success"
			});
		  } else {
			next();
		  }
	  } else {
		res.status(403).send({
			error: "User is not authenticated or is not an admin. Assignment cannot be removed unless user is admin or a teacher with a matching instructorId"
		})			
	  }
	} catch (err) {
	  console.error(err);
	  res.status(500).send({
		error: "Unable to delete assignment.  Please try again later."
	  });
	}
});


/*
 * Fetch the list of all Submissions for an Assignment.
 *
 *  Returns the list of all Submissions for an Assignment.  This list should be paginated.  Only an authenticated User with 'admin' role or an authenticated
 *  'instructor' User whose ID matches the `instructorId` of the Course corresponding to the Assignment's `courseId` can fetch the Submissions for an Assignment.
 */
router.get('/:id/submissions', requireAuthentication, async (req, res, next) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
	const assignment = await getAssignmentById(parseInt(req.params.id))
	const course = await getCourseDetailsById(assignment.courseId);
	if( req.role == 2 || (req.role == 1 && req.user == course.instructorId)){
		var coursePage = {};
		if(req.query.studentid){
			coursePage = await getSubmissionsPageByStudentId(parseInt(req.query.page) || 1, assignment.id, req.query.studentid);
		} else {
			coursePage = await getSubmissionsPage(parseInt(req.query.page) || 1, assignment.id);
		}
		coursePage.links = {};
		if (coursePage.page < coursePage.totalPages) {
		  coursePage.links.nextPage = `/submissions?page=${coursePage.page + 1}`;
		  coursePage.links.lastPage = `/submissions?page=${coursePage.totalPages}`;
		}
		if (coursePage.page > 1) {
		  coursePage.links.prevPage = `/submissions?page=${coursePage.page - 1}`;
		  coursePage.links.firstPage = '/submissions?page=1';
		}
		//res.status(200).send(submissionPage);
		res.status(200).send(coursePage);
	} else {
		res.status(403).send({
			error: "User is not authenticated to fetch the list of submissions" 
		})
	}
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching submission list.  Please try again later."
    });
  }
});

/*
Provide download
*/
router.use('/media/submissions', express.static(`${__dirname}/uploads`));

module.exports = router;
