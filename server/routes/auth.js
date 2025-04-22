import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Special handling for teacher login
    if (role === 'teacher') {
      if (email !== 'akashsimhadri4@gmail.com') {
        return res.status(403).json({ message: 'Unauthorized: Only specific teachers can access this platform' });
      }
      
      // For the teacher email, create the account if it doesn't exist
      let teacher = await User.findOne({ email });
      if (!teacher) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Akash@143', salt);
        
        teacher = new User({
          name: 'Akash Simhadri',
          email: 'akashsimhadri4@gmail.com',
          password: hashedPassword,
          role: 'teacher'
        });
        
        await teacher.save();
      }

      // Verify teacher password
      const isValidPassword = await bcrypt.compare(password, teacher.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: teacher._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role
        }
      });
    }

    // Regular student login
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;