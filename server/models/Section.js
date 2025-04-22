import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  courseId: {
    type: Number,
    required: true,
    ref: 'Course'
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Section', sectionSchema);