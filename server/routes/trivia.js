import express from 'express';
import Trivia from '../models/Trivia.js';
import User from '../models/User.js';

const router = express.Router();

// GET — all trivia entries
router.get('/', async (req, res) => {
  try {
    const trivia = await Trivia.find();
    res.json(trivia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new trivia entry for a landmark (admin copies coordinates from the pin)
router.post('/', async (req, res) => {
  try {
    const trivia = await Trivia.create(req.body);
    res.status(201).json(trivia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT — edit an existing trivia entry (coordinates are not editable)
router.put('/:id', async (req, res) => {
  try {
    const { question, options, correctIndex } = req.body;
    // debugging :(
    console.log('[PUT /api/trivia/:id] id =', req.params.id);
    const trivia = await Trivia.findById(req.params.id);
    console.log('[PUT /api/trivia/:id] found =', trivia ? trivia._id : null);
    if (!trivia) return res.status(404).json({ error: 'Trivia not found' });
    trivia.question = question;
    trivia.options = options;
    trivia.correctIndex = correctIndex;
    await trivia.save();
    res.json(trivia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — remove a trivia entry
router.delete('/:id', async (req, res) => {
  try {
    await Trivia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trivia deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — answer a trivia question
// body: { userId, answerIndex }
router.post('/:id/answer', async (req, res) => {
  try {
    const { userId, answerIndex } = req.body;
    const trivia = await Trivia.findById(req.params.id);
    if (!trivia) return res.status(404).json({ error: 'Trivia not found' });

    const correct = Number(answerIndex) === trivia.correctIndex;

    let completedTrivia;
    if (correct && userId) {
      // $addToSet keeps the list unique - https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
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
