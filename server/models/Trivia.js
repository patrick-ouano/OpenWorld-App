import mongoose from 'mongoose';

const triviaSchema = new mongoose.Schema({
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length === 3,
      message: 'trivia must have exactly 3 options',
    },
  },
  correctIndex: { type: Number, required: true, min: 0, max: 2 },
});

export default mongoose.model('Trivia', triviaSchema);
