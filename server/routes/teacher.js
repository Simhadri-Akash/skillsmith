import express from 'express';
import auth from '../middleware/auth.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to check if user is a teacher
const isTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's dashboard stats
router.get('/stats', auth, isTeacher, async (req, res) => {
  try {
    const totalStudents = await Enrollment.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalCourses = await Course.countDocuments();

    res.json({
      totalStudents,
      totalAssignments,
      totalVideos,
      totalCourses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher's courses
router.get('/courses', auth, isTeacher, async (req, res) => {
  try {
    const courses = await Course.find();
    
    // Get enrollment counts for each course
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
      const enrolledCount = await Enrollment.countDocuments({ courseId: course._id });
      return {
        ...course.toObject(),
        enrolledCount
      };
    }));
    
    res.json(coursesWithCounts);
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

// Delete a course
router.delete('/courses/:courseId', auth, isTeacher, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete associated videos
    await Video.deleteMany({ courseId: req.params.courseId });
    
    // Delete associated sections
    await Section.deleteMany({ courseId: req.params.courseId });
    
    // Delete associated assignments
    await Assignment.deleteMany({ courseId: req.params.courseId });
    
    // Delete the course
    await Course.findByIdAndDelete(req.params.courseId);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new section
router.post('/courses/:courseId/sections', auth, isTeacher, async (req, res) => {
  try {
    const section = new Section({
      id: uuidv4(),
      title: req.body.title,
      courseId: req.params.courseId,
      order: req.body.order
    });
    const newSection = await section.save();
    res.status(201).json(newSection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get course sections
router.get('/courses/:courseId/sections', auth, isTeacher, async (req, res) => {
  try {
    const sections = await Section.find({ courseId: req.params.courseId }).sort('order');
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a video to a course
router.post('/courses/:courseId/videos', auth, isTeacher, async (req, res) => {
  try {
    const video = new Video({
      courseId: req.params.courseId,
      ...req.body
    });
    console.log(video)
    const newVideo = await video.save();
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get course videos
router.get('/courses/:courseId/videos', auth, isTeacher, async (req, res) => {
  try {
    const videos = await Video.find({ courseId: req.params.courseId }).sort('order');
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enrolled students
router.get('/students', auth, isTeacher, async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('userId', 'name email')
      .populate('courseId', 'title');
      
    const students = enrollments.map(enrollment => ({
      _id: enrollment.userId._id,
      name: enrollment.userId.name,
      email: enrollment.userId.email,
      enrollments: [{
        courseId: enrollment.courseId._id,
        courseTitle: enrollment.courseId.title,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status
      }]
    }));

    // Group enrollments by student
    const groupedStudents = students.reduce((acc, curr) => {
      const existingStudent = acc.find(s => s._id === curr._id);
      if (existingStudent) {
        existingStudent.enrollments.push(...curr.enrollments);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    res.json(groupedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;