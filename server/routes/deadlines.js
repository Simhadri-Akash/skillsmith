import express from 'express';
import auth from '../middleware/auth.js';
import Deadline from '../models/Deadline.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Get deadlines for enrolled courses
router.get('/', auth, async (req, res) => {
  try {
    // Get user's enrollments
    const enrollments = await Enrollment.find({
      userId: req.userId,
      status: 'active'
    });

    // Get courseIds from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    // Get deadlines for enrolled courses
    const deadlines = await Deadline.find({
      courseId: { $in: courseIds },
      dueDate: { $gte: new Date() } // Only future deadlines
    })
    .sort('dueDate')
    .limit(10); // Limit to next 10 deadlines

    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;