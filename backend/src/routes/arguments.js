const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Argument = require('../models/Argument');
const Debate = require('../models/Debate');

const router = express.Router();

// Create argument
router.post('/', authMiddleware, [
  body('debateId').notEmpty().withMessage('Debate ID required'),
  body('content').trim().notEmpty().withMessage('Content required'),
  body('side').isIn(['A', 'B']).withMessage('Invalid side')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { debateId, content, side, type } = req.body;

    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    if (debate.status !== 'active') {
      return res.status(400).json({ error: 'Debate not active' });
    }

    const targetSide = side === 'A' ? 'sideA' : 'sideB';
    if (!debate[targetSide].users.some(u => u.toString() === req.userId)) {
      return res.status(403).json({ error: 'Not a participant of this side' });
    }

    const argCount = await Argument.countDocuments({ debateId, side });
    if (argCount >= debate.settings.argumentLimit) {
      return res.status(400).json({ error: 'Argument limit reached' });
    }

    const argument = new Argument({
      debateId,
      userId: req.userId,
      side,
      content,
      type: type || 'argument',
      order: argCount + 1
    });

    await argument.save();
    await argument.populate('userId', 'username');

    res.status(201).json(argument);
  } catch (error) {
    console.error('Create argument error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get arguments by debate
router.get('/debate/:debateId', async (req, res) => {
  try {
    const args = await Argument.find({ debateId: req.params.debateId })
      .populate('userId', 'username')
      .sort('order');

    res.json(args);
  } catch (error) {
    console.error('Get arguments error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;