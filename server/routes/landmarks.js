import express from 'express';
import Landmark from '../models/Landmark.js';
import User from '../models/User.js';
import Trivia from '../models/Trivia.js';

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

// DELETE — deletes a landmark and its associated trivia (matched by coordinates)
router.delete('/:id', async (req, res) => {
  try {
    const landmark = await Landmark.findByIdAndDelete(req.params.id);
    if (landmark) {
      await Trivia.deleteOne({
        'coordinates.latitude': landmark.coordinates.latitude,
        'coordinates.longitude': landmark.coordinates.longitude,
      });
    }
    res.json({ message: 'Landmark deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — answer a landmark's trivia question
// body: { userId, answerIndex }
router.post('/:id/answer', async (req, res) => {
  try {
    const { userId, answerIndex } = req.body;
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) return res.status(404).json({ error: 'Landmark not found' });
    if (!landmark.trivia || landmark.trivia.correctIndex == null) {
      return res.status(400).json({ error: 'No trivia on this landmark' });
    }

    const correct = Number(answerIndex) === landmark.trivia.correctIndex;

    let completedLandmarks;
    if (correct && userId) {
      // $addToSet keeps the list unique - https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
      const updated = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { completedLandmarks: landmark.name } },
        { new: true }
      );
      completedLandmarks = updated?.completedLandmarks || [];
    }

    res.json({ correct, completedLandmarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
