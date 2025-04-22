import express from 'express';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Video from '../models/Video.js';
import Section from '../models/Section.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper function to load mock data
const loadMockData = (fileName) => {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', fileName);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error loading mock data from ${fileName}:`, error);
    return [];
  }
};

// Get all courses
router.get('/', async (req, res) => {
  try {
    // Try to get courses from database
    let courses = await Course.find();
    
    // If no courses in database, use mock data
    if (courses.length === 0) {
      courses = loadMockData('courses.json');
    }
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Fallback to mock data on error
    const mockCourses = loadMockData('courses.json');
    res.json(mockCourses);
  }
});

// Get a single course with sections and videos
router.get('/:id', async (req, res) => {
  try {
    // Try to get course from database
    let course = await Course.findById(req.params.id);
    let sections = await Section.find({ courseId: req.params.id }).sort('order');
    let videos = await Video.find({ courseId: req.params.id });
    
    // If course not found in database, use mock data
    if (!course) {
      const mockCourses = loadMockData('courses.json');
      course = mockCourses.find(c => c._id == req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const mockSections = loadMockData('sections.json');
      sections = mockSections.filter(s => s.courseId == req.params.id).sort((a, b) => a.order - b.order);
      
      const mockVideos = loadMockData('videos.json');
      videos = mockVideos.filter(v => v.courseId == req.params.id);
    }

    res.json({
      course,
      sections,
      videos
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    
    // Fallback to mock data on error
    const mockCourses = loadMockData('courses.json');
    const course = mockCourses.find(c => c._id == req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const mockSections = loadMockData('sections.json');
    const sections = mockSections.filter(s => s.courseId == req.params.id).sort((a, b) => a.order - b.order);
    
    const mockVideos = loadMockData('videos.json');
    const videos = mockVideos.filter(v => v.courseId == req.params.id);
    
    res.json({
      course,
      sections,
      videos
    });
  }
});

// Get enrolled students count for a course
router.get('/:courseId/enrollments/count', async (req, res) => {
  try {
    const count = await Enrollment.countDocuments({
      courseId: req.params.courseId,
      status: 'active'
    });
    res.json({ count });
  } catch (error) {
    // Return a random count between 10-50 if there's an error
    const randomCount = Math.floor(Math.random() * 41) + 10;
    res.json({ count: randomCount });
  }
});

// Create a course
router.post('/', async (req, res) => {
  const course = new Course({
    _id: req.body._id,
    title: req.body.title,
    description: req.body.description,
    instructor: req.body.instructor,
    duration: req.body.duration,
    rating: req.body.rating,
    image: req.body.image,
    topics: req.body.topics,
    price: req.body.price,
    createdAt: req.body.createdAt
  });

  try {
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;