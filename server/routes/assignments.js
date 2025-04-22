import express from 'express';
import auth from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import User from '../models/User.js';

const router = express.Router();

// Get total assignments count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Assignment.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { courseId, title, description, questions, dueDate } = req.body;

    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required and must be an array' });
    }

    for (const question of questions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length < 2 || 
          typeof question.correctAnswer !== 'number' || question.correctAnswer >= question.options.length) {
        return res.status(400).json({ message: 'Invalid question format' });
      }
    }

    const assignment = new Assignment({
      courseId,
      title,
      description,
      questions,
      dueDate: new Date(dueDate)
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get assignments for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      courseId: req.params.courseId 
    }).sort({ dueDate: 1 });

    // Get submission status for each assignment
    const submissionPromises = assignments.map(assignment => 
      AssignmentSubmission.findOne({ 
        assignmentId: assignment._id, 
        userId: req.userId 
      })
    );

    const submissions = await Promise.all(submissionPromises);

    const assignmentsWithStatus = assignments.map((assignment, index) => ({
      ...assignment.toObject(),
      submitted: !!submissions[index],
      score: submissions[index]?.score || null
    }));

    res.json(assignmentsWithStatus);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment
router.post('/:assignmentId/submit', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment is past due
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: 'Assignment is past due' });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      userId: req.userId
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Validate answers format
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== assignment.questions.length) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Calculate score
    let score = 0;
    answers.forEach((answer, index) => {
      if (typeof answer.selectedOption === 'number' && 
          answer.selectedOption === assignment.questions[index].correctAnswer) {
        score++;
      }
    });

    const finalScore = (score / assignment.questions.length) * 100;

    const submission = new AssignmentSubmission({
      assignmentId: assignment._id,
      userId: req.userId,
      answers: answers,
      score: finalScore,
      submittedAt: new Date()
    });

    await submission.save();
    res.status(201).json({ 
      message: 'Assignment submitted successfully',
      score: finalScore, 
      submission 
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get student's submissions
router.get('/submissions', auth, async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ userId: req.userId })
      .populate('assignmentId')
      .sort({ submittedAt: -1 });

    const submissionsWithDetails = submissions.map(submission => ({
      ...submission.toObject(),
      assignment: submission.assignmentId,
      submittedAt: submission.submittedAt,
      score: submission.score
    }));

    res.json(submissionsWithDetails);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get assignment details (for students)
router.get('/:assignmentId', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      userId: req.userId
    });

    res.json({
      ...assignment.toObject(),
      submitted: !!submission,
      submission: submission || null
    });
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;