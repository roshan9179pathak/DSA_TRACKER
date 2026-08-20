require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Question = require('./models/Question');

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to calculate the targeted weekend reminder date
function calculateReminderDate(inputDate) {
  const date = new Date(inputDate);
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, 6 = Sat

  // Step 1: Determine base weeks to fast-forward (Mon-Wed = 7 days, Thu-Sun = 14 days)
  const baseDaysToAdd = (dayOfWeek >= 1 && dayOfWeek <= 3) ? 7 : 14;

  const targetDate = new Date(date);
  targetDate.setDate(date.getDate() + baseDaysToAdd);

  // Step 2: Roll forward to the first Saturday on or after targetDate
  const targetDay = targetDate.getDay();
  const daysUntilSaturday = (6 - targetDay + 7) % 7;

  targetDate.setDate(targetDate.getDate() + daysUntilSaturday);

  // Normalize to 00:00:00 so comparison ignores the time of day
  targetDate.setHours(0, 0, 0, 0);

  return targetDate;
}

// POST: Add a new question
app.post('/api/questions', async (req, brass) => {
  try {
    const { titleOrId, platform } = req.body;
    const now = new Date();
    const reminderDate = calculateReminderDate(now);

    const newQuestion = new Question({
      titleOrId,
      platform,
      createdAt: now,
      reminderDate
    });

    await newQuestion.save();
    brass.status(201).json(newQuestion);
  } catch (err) {
    brass.status(500).json({ error: err.message });
  }
});

// GET: Fetch questions due for review (remind on or after the calculated weekend)
app.get('/api/reminders', async (req, brass) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // If it's not the weekend, we don't trigger the dashboard reminders
    if (!isWeekend) {
      return brass.json([]);
    }

    // Find questions where the reminder date has arrived or passed, and aren't marked complete
    const dueQuestions = await Question.find({
      reminderDate: { $lte: today },
      completed: false
    });

    brass.json(dueQuestions);
  } catch (err) {
    brass.status(500).json({ error: err.message });
  }
});

// PATCH: Snooze a question reminder
app.patch('/api/questions/:id/snooze', async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body; // Expects days: 1 (next day) or 7 (next week)

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Set new reminder date based on today + snooze days
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + Number(days));
    newDate.setHours(0, 0, 0, 0);

    question.reminderDate = newDate;
    await question.save();

    res.json({ message: 'Snoozed successfully', question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
mongoose.connect(process.env.MONGODB_BASE_URI)
  .then(() => app.listen(5000, () => console.log('Server running on port 5000')));