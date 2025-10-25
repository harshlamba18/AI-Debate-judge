// backend/src/models/Debate.js
const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['1v1', 'team'],
    default: '1v1'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  sideA: {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    position: String,
    score: Number
  },
  sideB: {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    position: String,
    score: Number
  },
  settings: {
    timeLimit: { type: Number, default: 300 }, // seconds per turn
    argumentLimit: { type: Number, default: 5 }, // max arguments per side
    isPrivate: { type: Boolean, default: false }
  },
  aiJudgment: {
    verdict: String,
    reasoning: String,
    sideAScore: Number,
    sideBScore: Number,
    transactionHash: String,
    judgedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

debateSchema.index({ status: 1, createdAt: -1 });
debateSchema.index({ 'sideA.users': 1 });
debateSchema.index({ 'sideB.users': 1 });

module.exports = mongoose.model('Debate', debateSchema);