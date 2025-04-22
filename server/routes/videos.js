import express from 'express';
import auth from '../middleware/auth.js';
import VideoProgress from '../models/VideoProgress.js';
import Video from '../models/Video.js';
import User from '../models/User.js';

const router = express.Router();

// Update video progress
router.post('/:videoId/progress', auth, async (req, res) => {
  try {
    const { watchedSeconds, completed } = req.body;
    
    let progress = await VideoProgress.findOne({
      userId: req.userId,
      videoId: req.params.videoId
    });

    if (progress) {
      progress.watchedSeconds = watchedSeconds;
      progress.completed = completed;
      progress.lastWatched = new Date();
    } else {
      progress = new VideoProgress({
        userId: req.userId,
        videoId: req.params.videoId,
        watchedSeconds,
        completed
      });
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get video progress
router.get('/:videoId/progress', auth, async (req, res) => {
  try {
    const progress = await VideoProgress.findOne({
      userId: req.userId,
      videoId: req.params.videoId
    });

    res.json(progress || { watchedSeconds: 0, completed: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get total watched time for user
router.get('/total-time', auth, async (req, res) => {
  try {
    const progresses = await VideoProgress.find({ userId: req.userId });
    const totalSeconds = progresses.reduce((acc, curr) => acc + curr.watchedSeconds, 0);
    res.json({ totalSeconds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all videos for a course with progress
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const videos = await Video.find({ courseId: req.params.courseId }).sort('order');
    const progresses = await VideoProgress.find({
      userId: req.userId,
      videoId: { $in: videos.map(v => v._id) }
    });

    const videosWithProgress = videos.map(video => {
      const progress = progresses.find(p => p.videoId.toString() === video._id.toString());
      return {
        ...video.toObject(),
        progress: progress ? {
          watchedSeconds: progress.watchedSeconds,
          completed: progress.completed,
          lastWatched: progress.lastWatched
        } : null
      };
    });

    res.json(videosWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload video (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can upload videos' });
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(embed\/|watch\?v=)?([a-zA-Z0-9_-]{11})$/;
    if (!youtubeRegex.test(req.body.url)) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const highestOrder = await Video.findOne({ sectionId: req.body.sectionId }).sort('-order');
    const order = highestOrder ? highestOrder.order + 1 : 1;

    const video = new Video({
      ...req.body,
      order
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete video (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete videos' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await VideoProgress.deleteMany({ videoId: req.params.id });
    await video.remove();

    const remainingVideos = await Video.find({ sectionId: video.sectionId }).sort('order');
    for (let i = 0; i < remainingVideos.length; i++) {
      remainingVideos[i].order = i + 1;
      await remainingVideos[i].save();
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update video order (teacher only)
router.put('/:id/order', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can reorder videos' });
    }

    const { newOrder } = req.body;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const oldOrder = video.order;

    if (newOrder > oldOrder) {
      await Video.updateMany(
        {
          sectionId: video.sectionId,
          order: { $gt: oldOrder, $lte: newOrder }
        },
        { $inc: { order: -1 } }
      );
    } else if (newOrder < oldOrder) {
      await Video.updateMany(
        {
          sectionId: video.sectionId,
          order: { $gte: newOrder, $lt: oldOrder }
        },
        { $inc: { order: 1 } }
      );
    }

    video.order = newOrder;
    await video.save();

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
