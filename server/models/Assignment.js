import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
    maxLength: 2000
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000
    },
    options: [{
      type: String,
      required: true,
      trim: true,
      maxLength: 500
    }],
    correctAnswer: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  dueDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  timeLimit: {
    type: Number, // in minutes, optional
    default: null
  }
});

// Indexes for better query performance
assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ courseId: 1, isActive: 1 });

// Virtual for checking if assignment is past due
assignmentSchema.virtual('isPastDue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for time remaining until due date
assignmentSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const diff = this.dueDate.getTime() - now.getTime();
  return Math.max(0, diff);
});

export default mongoose.model('Assignment', assignmentSchema);