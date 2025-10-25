const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema({
  debateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  side: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['opening', 'argument', 'rebuttal', 'closing'],
    default: 'argument'
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

argumentSchema.index({ debateId: 1, order: 1 });
argumentSchema.index({ debateId: 1, side: 1 });

module.exports = mongoose.model('Argument', argumentSchema);