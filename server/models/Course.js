import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  _id: Number,
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  topics: [{
    type: String,
    required: true
  }],
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Course', courseSchema);