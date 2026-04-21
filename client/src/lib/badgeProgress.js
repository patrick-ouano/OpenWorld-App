import { BADGES, PLANNED_CHALLENGE_COUNT } from '../data/badges';

/** Same storage key as Login / Map (`authUser`). */
export function getCompletedTriviaIds() {
  try {
    const raw =
      localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    const user = JSON.parse(raw || 'null');
    const list = user?.completedTrivia ?? [];
    return Array.isArray(list) ? list.map((id) => String(id)) : [];
  } catch {
    return [];
  }
}

/* copilot helped fix this function, i dont understand the code and was stuck for a while */
export function evaluateChallenges(challenges, landmarks, trivia, completedTriviaIds) {
  const completedSet = new Set(
    (completedTriviaIds || []).map((id) => String(id)),
  );

  const coordToTriviaId = new Map();
  for (const t of trivia) {
    coordToTriviaId.set(
      `${t.coordinates.latitude},${t.coordinates.longitude}`,
      String(t._id),
    );
  }

  const nameToTriviaId = new Map();
  for (const lm of landmarks) {
    const key = `${lm.coordinates.latitude},${lm.coordinates.longitude}`;
    const tId = coordToTriviaId.get(key);
    if (tId) nameToTriviaId.set(lm.name, tId);
  }

  const totalTriviaCount = nameToTriviaId.size;
  const results = new Map();

  for (const ch of challenges) {
    let completed = 0;
    let total = 0;

    if (ch.type === 'threshold') {
      total = ch.requiredCount;
      completed = Math.min(completedSet.size, total);
    } else if (ch.type === 'all') {
      total = totalTriviaCount;
      for (const tId of nameToTriviaId.values()) {
        if (completedSet.has(tId)) completed++;
      }
    } else {
      total = ch.requiredLandmarks.length;
      for (const name of ch.requiredLandmarks) {
        const tId = nameToTriviaId.get(name);
        if (tId && completedSet.has(tId)) completed++;
      }
    }

    results.set(ch.id, { completed, total });
  }

  return results;
}

export function countFullyCompleted(progressMap) {
  let count = 0;
  for (const { completed, total } of progressMap.values()) {
    if (total > 0 && completed >= total) count++;
  }
  return count;
}

export function buildStats(fullyCompletedChallengeCount) {
  const completedCount = fullyCompletedChallengeCount;
  const totalChallenges = PLANNED_CHALLENGE_COUNT;
  const completionPct =
    totalChallenges === 0 ? 0 : Math.round((completedCount / totalChallenges) * 100);

  const unlockedBadges = BADGES.filter((b) => completedCount >= b.minCompleted);
  const lockedBadges = BADGES.filter((b) => completedCount < b.minCompleted);

  const rareUnlocked = unlockedBadges.filter(
    (b) => b.tier === 'rare' || b.tier === 'legendary',
  ).length;

  const badgesToGo = lockedBadges.length;

  const showcaseBadges = [...unlockedBadges]
    .sort((a, b) => a.minCompleted - b.minCompleted)
    .slice(-7)
    .reverse();

  return {
    totalChallenges,
    completedCount,
    completionPct,
    unlockedBadges,
    lockedBadges,
    rareUnlocked,
    badgesToGo,
    showcaseBadges,
  };
}

/** Highest-threshold badges first (closest to “most recently earned”). */
export function getRecentUnlockedBadges(fullyCompletedChallengeCount, limit = 4) {
  return [...BADGES]
    .filter((b) => fullyCompletedChallengeCount >= b.minCompleted)
    .sort((a, b) => b.minCompleted - a.minCompleted)
    .slice(0, limit);
}
