import dns from 'dns';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import landmarkRoutes from './routes/landmarks.js';

dns.setServers(['8.8.8.8', '8.8.4.4']); // fixes dns issues with mongodb connection 
// apparently is a node.js on windows issue 

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/openworld')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/landmarks', landmarkRoutes);

app.listen(process.env.PORT || 5000, () => console.log('Server on port 5000'));