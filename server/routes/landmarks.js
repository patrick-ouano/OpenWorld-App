import express from 'express';
import Landmark from '../models/Landmark.js';

// mongoose crud from https://mongoosejs.com/docs/queries.html
// basic crud for landmarks - no auth check yet, thats for sprint 2
const router = express.Router();

// POST — creates a new landmark
router.post('/', async (req, res) => {
  try {
    const landmark = await Landmark.create(req.body);
    res.status(201).json(landmark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET — fetches all landmarks
router.get('/', async (req, res) => {
  try {
    const landmarks = await Landmark.find();
    res.json(landmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — deletes a landmark
router.delete('/:id', async (req, res) => {
  try {
    await Landmark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Landmark deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
