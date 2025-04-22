import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true,
    ref: 'Course'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateUrl: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  }
});

export default mongoose.model('Certificate', certificateSchema);