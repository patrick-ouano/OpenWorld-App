import express from 'express';
import Landmark from '../models/Landmark.js';

const router = express.Router();

// POST / — create a new landmark
router.post('/', async (req, res) => {
  try {
    const landmark = await Landmark.create(req.body);
    res.status(201).json(landmark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET / — fetch all landmarks
router.get('/', async (req, res) => {
  try {
    const landmarks = await Landmark.find();
    res.json(landmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — delete a landmark
router.delete('/:id', async (req, res) => {
  try {
    await Landmark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Landmark deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
