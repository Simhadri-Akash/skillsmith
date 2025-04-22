import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true,
    ref: 'Course'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 3600
  },
  resolution: {
    type: String,
    enum: ['720p', '1080p', '1440p', '2160p'],
    default: '1080p'
  },
  sectionId: {
    type: String,
    required: true,
    ref: 'Section'
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: String,
  size: Number, // in bytes
  format: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Format duration for display
videoSchema.methods.formatDuration = function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  return [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].filter(Boolean).join(':');
};

// Ensure videos are ordered within a course
videoSchema.index({ courseId: 1, order: 1 });

// Add text index for search
videoSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Video', videoSchema);