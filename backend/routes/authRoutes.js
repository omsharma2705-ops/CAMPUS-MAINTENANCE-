const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');

const User = require('../models/User');

// Helper to sign JWT
const signToken = (user, res) => {
  const payload = {
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      department: user.department,
      cardId: user.cardId,
      trade: user.trade,
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
          cardId: user.cardId,
          trade: user.trade,
        }
      });
    }
  );
};

// @route   POST api/auth/register
// @desc    Register user (Student / Staff / Worker / Admin) with I-Card
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, department, phone, cardId, trade } = req.body;

  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    const generatedCardId = cardId && cardId.trim() 
      ? cardId.trim().toUpperCase() 
      : `CAMPUS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if cardId is already taken
    const existingCard = await User.findOne({ cardId: generatedCardId });
    if (existingCard) {
      return res.status(400).json({ msg: 'University I-Card Number is already registered' });
    }

    user = new User({
      name,
      email: cleanEmail,
      password,
      role: role || 'student',
      department: department || 'General Campus',
      phone: phone || '',
      cardId: generatedCardId,
      trade: trade || '',
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    signToken(user, res);
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user via Email OR University I-Card & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginKey = (identifier || email || '').trim();

  if (!loginKey) {
    return res.status(400).json({ msg: 'Please provide Email or University I-Card Number' });
  }

  try {
    // Search by email OR by University I-Card number (case-insensitive)
    let user = await User.findOne({
      $or: [
        { email: loginKey.toLowerCase() },
        { cardId: loginKey.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials. User with this Email or I-Card not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: 'Account is deactivated. Contact Administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials. Incorrect password.' });
    }

    signToken(user, res);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   POST api/auth/sso
// @desc    Simulated University OAuth2 / Single Sign-On Authentication
// @access  Public
router.post('/sso', async (req, res) => {
  const { provider = 'University Google SSO', email, role = 'student', name } = req.body;

  try {
    let targetEmail = email ? email.toLowerCase().trim() : 'student@campus.edu';
    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      // Create user on first SSO login
      const defaultCardId = `CAMPUS-SSO-${Math.floor(1000 + Math.random() * 9000)}`;
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash('sso_authenticated_' + Math.random(), salt);

      user = new User({
        name: name || (role === 'admin' ? 'University Dean / Admin' : 'University Scholar'),
        email: targetEmail,
        password: defaultPassword,
        role: role,
        department: role === 'worker' ? 'Electrical Maintenance' : 'Computer Science & Engineering',
        phone: '+91 98111 99999',
        cardId: defaultCardId,
        trade: role === 'worker' ? 'Electrician' : '',
      });

      await user.save();
    }

    signToken(user, res);
  } catch (err) {
    console.error('SSO error:', err.message);
    res.status(500).json({ msg: 'OAuth2 / SSO authentication failed' });
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
