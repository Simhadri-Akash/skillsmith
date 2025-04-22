import express from 'express';
import auth from '../middleware/auth.js';
import Material from '../models/Material.js';
import User from '../models/User.js';

const router = express.Router();

// Get all materials for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const materials = await Material.find({ courseId: req.params.courseId })
      .populate('uploadedBy', 'name');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload new material (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can upload materials' });
    }

    const material = new Material({
      ...req.body,
      uploadedBy: req.userId
    });

    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete material (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete materials' });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;