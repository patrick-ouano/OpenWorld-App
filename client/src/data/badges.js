/** Total number of challenges — must match CHALLENGES.length in challenges.js. */
export const PLANNED_CHALLENGE_COUNT = 12;

// Unlock when the user has completed at least `minCompleted` challenges (any order).
export const BADGES = [
  { id: 'first-step', name: 'First Steps', abbr: '1', minCompleted: 1, tier: 'common', blurb: 'Finished your first challenge.' },
  { id: 'triple', name: 'Triple Threat', abbr: '3', minCompleted: 3, tier: 'common', blurb: 'Three challenges down.' },
  { id: 'half-dozen', name: 'Half Dozen Hero', abbr: '6', minCompleted: 6, tier: 'common', blurb: 'Six challenges complete.' },
  { id: 'swamp-scholar', name: 'Swamp Scholar', abbr: 'SS', minCompleted: 8, tier: 'rare', blurb: 'Deep campus & tradition knowledge.' },
  { id: 'orange-core', name: 'Orange & Blue Core', abbr: 'OB', minCompleted: 10, tier: 'rare', blurb: 'Almost the full set.' },
  { id: 'gator-legend', name: 'Gator Legend', abbr: '★', minCompleted: 12, tier: 'legendary', blurb: 'Every challenge conquered.' },
];
