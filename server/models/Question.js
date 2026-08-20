const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  titleOrId: { type: String, required: true },
  platform: { type: String, enum: ['LeetCode', 'GeeksforGeeks'], required: true },
  createdAt: { type: Date, default: Date.now },
  reminderDate: { type: Date, required: true },
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Question', QuestionSchema);