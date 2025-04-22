import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    selectedOption: {
      type: Number,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  }
});

// Compound index for faster queries
assignmentSubmissionSchema.index({ assignmentId: 1, userId: 1 }, { unique: true });

// Index for finding all submissions by a user
assignmentSubmissionSchema.index({ userId: 1, submittedAt: -1 });

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);