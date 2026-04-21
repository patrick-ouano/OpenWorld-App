import express from 'express';
import User from '../models/User.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

// returns current user explored cells
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('exploredCells');
    if (!user) return res.status(404).json({ message: 'user not found' });

    return res.json({ exploredCells: user.exploredCells || [] });
  } catch (err) {
    return res.status(500).json({ message: 'server error', error: err.message });
  }
});

// saves new explored cells for current user
router.post('/me', async (req, res) => {
  try {
    const { cells } = req.body;

    if (!Array.isArray(cells)) {
      return res.status(400).json({ message: 'cells must be an array of strings' });
    }

    // keeps only non-empty strings
    const validCells = cells.filter((cell) => typeof cell === 'string' && cell.trim() !== '');

    if (validCells.length === 0) {
      const user = await User.findById(req.user.id).select('exploredCells');
      if (!user) return res.status(404).json({ message: 'user not found' });
      return res.json({ exploredCells: user.exploredCells || [] });
    }

    // $addToSet avoids duplicate cells automatically - https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { exploredCells: { $each: validCells } } },
      { new: true, projection: { exploredCells: 1 } },
    );

    if (!updatedUser) return res.status(404).json({ message: 'user not found' });

    return res.json({ exploredCells: updatedUser.exploredCells || [] });
  } catch (err) {
    return res.status(500).json({ message: 'server error', error: err.message });
  }
});

export default router;
