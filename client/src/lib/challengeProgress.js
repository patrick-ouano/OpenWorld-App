/** Skeleton for challenge completions; Badges reads this until Challenges is built. */

function storageKey(userId) {
  return `openworld_challenges_${userId}`;
}

function getStoredUserId() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const u = JSON.parse(raw || 'null');
    return u?.id ?? 'guest';
  } catch {
    return 'guest';
  }
}

export function getCompletedChallengeIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(storageKey(getStoredUserId())) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
