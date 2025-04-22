import express from 'express';
import auth from '../middleware/auth.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Get user's enrollments
router.get('/', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      userId: req.userId,
      status: 'active'
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new enrollment
router.post('/', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      courseId,
      userId: req.userId,
      status: 'active'
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = new Enrollment({
      courseId,
      userId: req.userId
    });

    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;