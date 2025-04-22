import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import connectDB from '../server/config/db.js';
import authRoutes from '../server/routes/auth.js';
import courseRoutes from '../server/routes/courses.js';
import enrollmentRoutes from '../server/routes/enrollments.js';
import teacherRoutes from '../server/routes/teacher.js';
import deadlineRoutes from '../server/routes/deadlines.js';
import assignmentRoutes from '../server/routes/assignments.js';
import videoRoutes from '../server/routes/videos.js';
import materialRoutes from '../server/routes/materials.js';
import certificateRoutes from '../server/routes/certificates.js';
import contentRoutes from '../server/routes/content.js';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/content', contentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});