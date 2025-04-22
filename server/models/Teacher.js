import express from 'express';
import auth from '../middleware/auth.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import Deadline from '../models/Deadline.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check if user is a teacher
const isTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's courses
router.get('/courses', auth, isTeacher, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.userId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new course
router.post('/courses', auth, isTeacher, async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instructor: req.userId
    });
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a video to a course
router.post('/courses/:courseId/videos', auth, isTeacher, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, instructor: req.userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const video = new Video({
      courseId: req.params.courseId,
      ...req.body
    });
    const newVideo = await video.save();
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a deadline to a course
router.post('/courses/:courseId/deadlines', auth, isTeacher, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, instructor: req.userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const deadline = new Deadline({
      courseId: req.params.courseId,
      ...req.body
    });
    const newDeadline = await deadline.save();
    res.status(201).json(newDeadline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get course videos
router.get('/courses/:courseId/videos', auth, isTeacher, async (req, res) => {
  try {
    const videos = await Video.find({ courseId: req.params.courseId })
      .sort('order');
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get course deadlines
router.get('/courses/:courseId/deadlines', auth, isTeacher, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ courseId: req.params.courseId })
      .sort('dueDate');
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;