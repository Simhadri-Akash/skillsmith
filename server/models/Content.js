import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    ref: 'Video'
  },
  timestamp: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Content', contentSchema);