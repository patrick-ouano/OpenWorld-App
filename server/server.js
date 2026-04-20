// setup based on https://www.mongodb.com/resources/languages/mern-stack-tutorial
import dns from 'dns';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import landmarkRoutes from './routes/landmarks.js';
import authRoutes from './routes/auth.js';

dns.setServers(['8.8.8.8', '8.8.4.4']); // fixes dns issues with mongodb connection 
// apparently is a node.js on windows issue 

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/openworld')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// used to check if the server is running
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/landmarks', landmarkRoutes);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`Server on port ${port}`));