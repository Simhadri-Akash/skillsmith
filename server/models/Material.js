import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true,
    ref: 'Course'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Material', materialSchema);