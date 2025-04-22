import express from 'express';
import auth from '../middleware/auth.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';

const router = express.Router();

// Upload certificate template (teacher only)
router.post('/template', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can upload certificate templates' });
    }

    const { courseId, templateUrl } = req.body;
    
    // Check if template already exists
    let certificate = await Certificate.findOne({ courseId });
    
    if (certificate) {
      certificate.templateUrl = templateUrl;
      await certificate.save();
    } else {
      certificate = new Certificate({
        courseId,
        templateUrl,
        userId: req.userId,
        completionDate: new Date()
      });
      await certificate.save();
    }

    res.status(201).json(certificate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get certificate for a course (student)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      courseId: req.params.courseId,
      userId: req.userId
    });
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;