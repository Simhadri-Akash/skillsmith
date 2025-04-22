import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true,
    ref: 'Course'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  dueDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'quiz', 'project', 'exam'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Deadline', deadlineSchema);