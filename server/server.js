import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import questionRoutes from './routes/questions.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/questions', questionRoutes);

app.get('/', (req, res) => {
  res.send('DSA Tracker API is running');
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dsa-tracker';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
