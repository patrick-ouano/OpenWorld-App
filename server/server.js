import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/openworld')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 5000, () => console.log('Server on port 5000'));