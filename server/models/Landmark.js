import mongoose from 'mongoose';

const landmarkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
});

export default mongoose.model('Landmark', landmarkSchema);
