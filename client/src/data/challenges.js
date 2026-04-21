// Challenge definitions for the Badges page.
// Each challenge tracks trivia completion at specific landmarks.
//
// There are 3 types of challenges:
//    'specific' — requires completing trivia at every landmark in requiredLandmarks.
//    'threshold' — requires completing trivia at any N landmarks total.
//    'all' — requires completing trivia at every landmark that has trivia.
//
// requiredLandmarks values must match the landmark `name` field in MongoDB exactly.

export const CHALLENGES = [
  {
    id: 'freshman-orientation',
    name: 'Freshman Orientation',
    description: 'Complete trivia at your very first pin anywhere on the map to begin your journey.',
    type: 'threshold',
    requiredCount: 1,
  },
  {
    id: 'campus-tour-guide',
    name: 'The Campus Tour Guide',
    description: 'Visit and conquer the fundamental staples of the UF campus by completing the trivia at Century Tower, Turlington Plaza, and The Hub.',
    type: 'specific',
    requiredLandmarks: ['Century Tower', 'Turlington Plaza', 'The Hub'],
  },
  {
    id: 'landmark-legend',
    name: 'Landmark Legend',
    description: 'Complete the trivia at the Landmark-category pins: Century Tower, French Fries, The Potato, Turlington Plaza, and the UF Bat Houses.',
    type: 'specific',
    requiredLandmarks: ['Century Tower', 'French Fries', 'The Potato', 'Turlington Plaza', 'UF Bat Houses'],
  },
  {
    id: 'dining-connoisseur',
    name: 'Dining Connoisseur',
    description: 'Complete the trivia at all Dining-category locations: Broward Dining, Gator Corner Dining Center, The Hub, Reitz Union Food Court, and United Table at Racquet Club.',
    type: 'specific',
    requiredLandmarks: ['Broward Dining', 'Gator Corner Dining Center', 'The Hub', 'Reitz Union Food Court', 'United Table at Racquet Club'],
  },
  {
    id: 'the-resident',
    name: 'The Resident',
    description: 'Complete the trivia at the Housing-category locations: Broward Hall, Beaty Towers, Hume Hall, Murphree Area, and Honors Village.',
    type: 'specific',
    requiredLandmarks: ['Broward Hall', 'Beaty Towers', 'Hume Hall', 'Murphree Area', 'Honors Village'],
  },
  {
    id: 'the-bookworm',
    name: 'The Bookworm',
    description: 'Complete the trivia at every Library-category location: Library West, Marston Science Library, Smathers Library, and Architecture & Fine Arts Library.',
    type: 'specific',
    requiredLandmarks: ['Library West', 'Marston Science Library', 'Smathers Library', 'Architecture & Fine Arts Library'],
  },
  {
    id: 'food-art-critic',
    name: 'Food Art Critic',
    description: 'Complete trivia at both of UF\'s food-shaped sculptures: the French Fries and The Potato.',
    type: 'specific',
    requiredLandmarks: ['French Fries', 'The Potato'],
  },
  {
    id: 'east-campus-explorer',
    name: 'The East Campus Explorer',
    description: 'Complete the trivia for the pins clustered on the eastern side of campus: Broward Hall, Honors Village, and Cypress Hall.',
    type: 'specific',
    requiredLandmarks: ['Broward Hall', 'Honors Village', 'Cypress Hall'],
  },
  {
    id: 'heart-of-campus',
    name: 'The Heart of Campus',
    description: 'Complete the trivia for the central campus pins: Century Tower, Turlington Plaza, Library West, and The Hub.',
    type: 'specific',
    requiredLandmarks: ['Century Tower', 'Turlington Plaza', 'Library West', 'The Hub'],
  },
  {
    id: 'half-dozen',
    name: 'Half Dozen Hero',
    description: 'Complete trivia at any six different locations across the map.',
    type: 'threshold',
    requiredCount: 6,
  },
  {
    id: 'double-digits',
    name: 'Double Digits',
    description: 'Complete trivia at ten different locations.',
    type: 'threshold',
    requiredCount: 10,
  },
  {
    id: 'true-florida-gator',
    name: 'The True Florida Gator',
    description: 'Achieve 100% completion: visit every single pin that has trivia and answer every question correctly.',
    type: 'all',
  },
];
