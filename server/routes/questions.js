import express from 'express';
import Question from '../models/Question.js';
import { computeReminderDate, isWeekend } from '../utils/reminderDate.js';

const router = express.Router();

// GET all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new question
router.post('/', async (req, res) => {
  try {
    const { title, platform } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Question title/number is required' });
    }
    if (!['LeetCode', 'GeeksforGeeks'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be LeetCode or GeeksforGeeks' });
    }

    const addedDate = new Date();
    const reminderDate = computeReminderDate(addedDate);

    const question = await Question.create({
      title: title.trim(),
      platform,
      addedDate,
      reminderDate,
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET questions due for reminder (reminderDate has arrived).
// isWeekend tells the frontend whether it should actually show the banner.
router.get('/due', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueQuestions = await Question.find({
      reminderDate: { $lte: today },
    }).sort({ reminderDate: 1 });

    res.json({
      isWeekend: isWeekend(new Date()),
      count: dueQuestions.length,
      questions: dueQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark a question as reattempted -> reschedule it using the same rule
router.patch('/:id/reattempt', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const now = new Date();
    question.lastReattemptedAt = now;
    question.reattemptCount += 1;
    question.reminderDate = computeReminderDate(now);
    await question.save();

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a question
router.delete('/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
