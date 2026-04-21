// Express router https://expressjs.com/en/guide/routing.html
import express from 'express';
import Trivia from '../models/Trivia.js';
import User from '../models/User.js';

const router = express.Router();

// GET — all trivia entries
// Mongoose find https://mongoosejs.com/docs/api/model.html#Model.find()
router.get('/', async (req, res) => {
  try {
    const trivia = await Trivia.find();
    res.json(trivia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new trivia entry (admin supplies coordinates copied from the pin)
// Mongoose create https://mongoosejs.com/docs/api/model.html#Model.create()
router.post('/', async (req, res) => {
  try {
    const trivia = await Trivia.create(req.body);
    res.status(201).json(trivia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT — edit an existing trivia entry (coordinates are not editable)
// Mongoose findByIdAndUpdate https://mongoosejs.com/docs/api/model.html#Model.findByIdAndUpdate()
// runValidators + context: 'query' required for update validators on arrays
// https://mongoosejs.com/docs/validation.html#update-validators
router.put('/:id', async (req, res) => {
  try {
    const { question, options, correctIndex } = req.body;
    const trivia = await Trivia.findByIdAndUpdate(
      req.params.id,
      { question, options, correctIndex },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!trivia) return res.status(404).json({ error: 'Trivia not found' });
    res.json(trivia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — remove a trivia entry
// Mongoose findByIdAndDelete https://mongoosejs.com/docs/api/model.html#Model.findByIdAndDelete()
router.delete('/:id', async (req, res) => {
  try {
    await Trivia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trivia deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — submit an answer to a trivia question
// body: { userId, answerIndex }
// MongoDB $addToSet https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
router.post('/:id/answer', async (req, res) => {
  try {
    const { userId, answerIndex } = req.body;
    const trivia = await Trivia.findById(req.params.id);
    if (!trivia) return res.status(404).json({ error: 'Trivia not found' });

    const correct = Number(answerIndex) === trivia.correctIndex;

    let completedTrivia;
    if (correct && userId) {
      // $addToSet keeps the array unique without a manual dedup step
      const updated = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { completedTrivia: trivia._id.toString() } },
        { new: true }
      );
      completedTrivia = updated?.completedTrivia || [];
    }

    res.json({ correct, completedTrivia });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
