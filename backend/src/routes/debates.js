// backend/src/routes/debates.js
// ============================================
const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const User = require('../models/User');

const router = express.Router();

// Create debate
router.post('/', authMiddleware, [
  body('topic').trim().notEmpty().withMessage('Topic required'),
  body('type').isIn(['1v1', 'team']).withMessage('Invalid debate type')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { topic, description, type, settings, sideAPosition, sideBPosition } = req.body;

    const debate = new Debate({
      topic,
      description,
      type,
      sideA: { users: [req.userId], position: sideAPosition || 'For' },
      sideB: { users: [], position: sideBPosition || 'Against' },
      settings: settings || {},
      createdBy: req.userId
    });

    await debate.save();
    await debate.populate('sideA.users sideB.users createdBy', 'username email');

    res.status(201).json(debate);
  } catch (error) {
    console.error('Create debate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all debates
router.get('/', async (req, res) => {
  try {
    const { status, userId } = req.query;
    const query = {};

    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }
    
    if (userId) {
      query.$or = [
        { 'sideA.users': userId },
        { 'sideB.users': userId }
      ];
    }

    const debates = await Debate.find(query)
      .populate('sideA.users sideB.users createdBy', 'username email')
      .sort('-createdAt')
      .limit(50);

    res.json(debates);
  } catch (error) {
    console.error('Get debates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get debate by ID
router.get('/:id', async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('sideA.users sideB.users createdBy', 'username email');
    
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    res.json(debate);
  } catch (error) {
    console.error('Get debate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join debate
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { side } = req.body;
    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    if (debate.status !== 'waiting') {
      return res.status(400).json({ error: 'Debate already started' });
    }

    const targetSide = side === 'A' ? 'sideA' : 'sideB';
    const otherSide = side === 'A' ? 'sideB' : 'sideA';
    
    if (debate[targetSide].users.some(u => u.toString() === req.userId)) {
      return res.status(400).json({ error: 'Already joined this side' });
    }
    
    if (debate[otherSide].users.some(u => u.toString() === req.userId)) {
      return res.status(400).json({ error: 'Already joined the other side' });
    }

    debate[targetSide].users.push(req.userId);
    
    if (debate.sideA.users.length > 0 && debate.sideB.users.length > 0) {
      debate.status = 'active';
      debate.startedAt = new Date();
    }

    await debate.save();
    await debate.populate('sideA.users sideB.users createdBy', 'username email');

    res.json(debate);
  } catch (error) {
    console.error('Join debate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Judge debate
router.post('/:id/judge', authMiddleware, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    if (debate.status !== 'active') {
      return res.status(400).json({ error: 'Debate not ready for judging' });
    }

    if (debate.aiJudgment && debate.aiJudgment.verdict) {
      return res.status(400).json({ error: 'Debate already judged' });
    }

    const debateArguments = await Argument.find({ debateId: debate._id }).sort('order');
    
    const sideAArgs = debateArguments.filter(a => a.side === 'A').map(a => a.content).join(' ');
    const sideBArgs = debateArguments.filter(a => a.side === 'B').map(a => a.content).join(' ');

    if (!sideAArgs || !sideBArgs) {
      return res.status(400).json({ error: 'Both sides must have arguments' });
    }

    console.log('Sending to AI judge...');
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/judge`, {
      side_a: sideAArgs,
      side_b: sideBArgs,
      topic: debate.topic
    });

    const { side_a_score, side_b_score, verdict, reasoning, transaction_hash } = aiResponse.data;

    debate.aiJudgment = {
      sideAScore: side_a_score,
      sideBScore: side_b_score,
      verdict,
      reasoning,
      transactionHash: transaction_hash,
      judgedAt: new Date()
    };
    debate.sideA.score = side_a_score;
    debate.sideB.score = side_b_score;
    debate.status = 'completed';
    debate.completedAt = new Date();

    await debate.save();
    await updateUserStats(debate);

    res.json(debate);
  } catch (error) {
    console.error('Judge error:', error);
    res.status(500).json({ 
      error: error.response?.data?.detail || error.message || 'Failed to judge debate' 
    });
  }
});

// 🧩 NEW: Get logged-in user's debate statistics
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('debateStats');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.debateStats || { total: 0, wins: 0, losses: 0 });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

async function updateUserStats(debate) {
  try {
    const winningSide = debate.sideA.score > debate.sideB.score ? 'sideA' : 'sideB';
    const losingSide = winningSide === 'sideA' ? 'sideB' : 'sideA';

    for (const userId of debate[winningSide].users) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'debateStats.total': 1, 'debateStats.wins': 1 }
      });
    }

    for (const userId of debate[losingSide].users) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'debateStats.total': 1, 'debateStats.losses': 1 }
      });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

module.exports = router;
