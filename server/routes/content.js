import express from 'express';
import auth from '../middleware/auth.js';
import Content from '../models/Content.js';
import User from '../models/User.js';

const router = express.Router();

// Get content for a video
router.get('/video/:videoId', auth, async (req, res) => {
  try {
    const content = await Content.find({ videoId: req.params.videoId })
      .sort('timestamp');
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add content to video (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can add content' });
    }

    const content = new Content(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete content (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete content' });
    }

    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;