import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'Explorer',
  },
  // stores explored map cells per user
  exploredCells: {
    type: [String],
    default: [],
  },
  completedTrivia: {
    type: [String],
    default: [],
  },
});

const User = mongoose.model('User', userSchema);
export default User;