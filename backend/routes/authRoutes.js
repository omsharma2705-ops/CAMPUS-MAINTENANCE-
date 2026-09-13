const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');

const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user (Student / Staff / Worker / Admin)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'student',
      department: department || 'General Campus',
      phone: phone || '',
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        department: user.department,
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials. User does not exist.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: 'Account is deactivated. Contact Administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials. Incorrect password.' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        department: user.department,
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   GET api/auth/me
// @desc    Get currently logged in user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
