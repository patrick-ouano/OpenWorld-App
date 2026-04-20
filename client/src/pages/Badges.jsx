import { useEffect, useMemo, useState } from 'react';

import { BADGES, PLANNED_CHALLENGE_COUNT } from '../data/badges';
import { getCompletedChallengeIds } from '../lib/challengeProgress';
import './Badges.css';

const CHALLENGES = [
  {
    "name": "Freshman Orientation",
    "description": "Visit your very first pin anywhere on the map and correctly answer its trivia question to begin your journey."
  },
  {
    "name": "The Campus Tour Guide",
    "description": "Visit and conquer the fundamental staples of the UF campus. You must complete the pins at Century Tower, Ben Hill Griffin Stadium, the J. Wayne Reitz Union, and Plaza of the Americas."
  },
  {
    "name": "Landmark Legend",
    "description": "Visit and correctly answer the trivia at all locations in the Landmarks category: Century Tower, The \"French Fries\" (Alachua) Sculpture, University Auditorium, The Bat Houses, and the Albert and Alberta Statues."
  },
  {
    "name": "Dining Connoisseur",
    "description": "Visit and correctly answer the trivia at all locations in the Dining category: Gator Corner Dining Center, Broward Dining, The Hub, and the Reitz Union Food Court."
  },
  {
    "name": "The Resident",
    "description": "Visit and correctly answer the trivia at all locations in the Housing category: Broward Hall, Hume Hall, Beaty Towers, and the historic Murphree Hall."
  },
  {
    "name": "The Bookworm",
    "description": "Visit and correctly answer the trivia at all locations in the Libraries category: Library West, Marston Science Library, Smathers Library (East), and the Architecture & Fine Arts (AFA) Library."
  },
  {
    "name": "The Historic Gator",
    "description": "Complete the trivia at UF's oldest and most historically significant buildings by visiting Murphree Hall, Smathers Library (East), and University Auditorium."
  },
  {
    "name": "The STEM Scholar",
    "description": "Complete the trivia at the science and engineering-focused locations by visiting Marston Science Library, Hume Hall, and The Bat Houses."
  },
  {
    "name": "The Arts & Culture Critic",
    "description": "Complete the trivia at UF's creative hubs by visiting the Architecture & Fine Arts Library, the University Auditorium, and the \"French Fries\" (Alachua) Sculpture."
  },
  {
    "name": "The East Campus Explorer",
    "description": "Complete the trivia for the pins clustered on the eastern side of campus by visiting Beaty Towers, Broward Hall, and Broward Dining."
  },
  {
    "name": "The Heart of Campus",
    "description": "Complete the trivia for the high-traffic central campus pins by visiting Library West, The Hub, and Century Tower."
  },
  {
    "name": "The True Florida Gator",
    "description": "Achieve 100% completion. Visit every single pin across all four categories (Landmarks, Dining, Housing, and Libraries) and answer all the trivia questions correctly."
  }
];

function buildStats(completedIds) {
  const totalChallenges = PLANNED_CHALLENGE_COUNT;
  const completedCount = completedIds.length;
  const completionPct =
    totalChallenges === 0 ? 0 : Math.round((completedCount / totalChallenges) * 100);

  const unlockedBadges = BADGES.filter((b) => completedCount >= b.minCompleted);
  const lockedBadges = BADGES.filter((b) => completedCount < b.minCompleted);

  const rareUnlocked = unlockedBadges.filter(
    (b) => b.tier === 'rare' || b.tier === 'legendary'
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

function Badges() {
  const [completedIds, setCompletedIds] = useState(() => getCompletedChallengeIds());

  useEffect(() => {
    const on = () => setCompletedIds(getCompletedChallengeIds());
    window.addEventListener('openworld-progress', on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener('openworld-progress', on);
      window.removeEventListener('storage', on);
    };
  }, []);

  const stats = useMemo(() => buildStats(completedIds), [completedIds]);

  const gridSlots = useMemo(() => {
    const maxShow = 11;
    const unlockedOrdered = [...stats.unlockedBadges].sort(
      (a, b) => a.minCompleted - b.minCompleted
    );
    const shown = unlockedOrdered.slice(0, maxShow);
    const overflow =
      stats.unlockedBadges.length > maxShow ? stats.unlockedBadges.length - maxShow : 0;
    const remainingSlots = maxShow - shown.length;
    const lockedPreview = stats.lockedBadges.slice(0, Math.max(0, remainingSlots));
    return { shown, lockedPreview, overflow };
  }, [stats.unlockedBadges, stats.lockedBadges]);

  return (
    <div className="gw-page badges-page">
      <div className="gw-page-inner">
        <section className="showcase-card" aria-labelledby="badge-collector-heading">
          <h2 className="showcase-card__header" id="badge-collector-heading">
            Badge collector
          </h2>
          <div className="showcase-card__body">
            <div className="badge-icon-grid" role="list">
              {gridSlots.shown.map((b) => (
                <div
                  key={b.id}
                  className={`badge-slot badge-slot--unlocked ${b.tier}`}
                  role="listitem"
                  title={b.blurb}
                >
                  <span className="badge-slot__abbr">{b.abbr}</span>
                </div>
              ))}
              {gridSlots.lockedPreview.map((b) => (
                <div
                  key={`lock-${b.id}`}
                  className="badge-slot badge-slot--locked"
                  role="listitem"
                  title={`Locked — complete ${b.minCompleted} challenges`}
                >
                  <span className="badge-slot__abbr">{b.abbr}</span>
                  <span className="badge-slot__lock" aria-hidden>
                    🔒
                  </span>
                </div>
              ))}
              {gridSlots.overflow > 0 ? (
                <div className="badges-overflow" title="More badges earned">
                  +{gridSlots.overflow}
                </div>
              ) : null}
            </div>

            <div className="showcase-stat-row">
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.unlockedBadges.length}</div>
                <div className="showcase-stat__label">Badges earned</div>
              </div>
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.rareUnlocked}</div>
                <div className="showcase-stat__label">Rare &amp; legendary</div>
              </div>
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.badgesToGo}</div>
                <div className="showcase-stat__label">Badges left to earn</div>
              </div>
            </div>
          </div>
        </section>

        <section className="showcase-card" aria-labelledby="challenge-mastery-heading">
          <h2 className="showcase-card__header" id="challenge-mastery-heading">
            Challenge mastery
          </h2>
          <div className="showcase-card__body">
            <div className="challenges-list" role="list">
              {CHALLENGES.map((c, i) => (
                <div key={i} className="challenge-item" role="listitem">
                  <div className="challenge-item__name">{c.name}</div>
                  <div className="challenge-item__desc">{c.description}</div>
                </div>
              ))}
            </div>

            <div className="showcase-stat-row showcase-stat-row--duo">
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.completedCount}</div>
                <div className="showcase-stat__label">Challenges completed</div>
              </div>
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.totalChallenges}</div>
                <div className="showcase-stat__label">Total challenges</div>
              </div>
              <div className="showcase-stat">
                <div className="showcase-stat__value">{stats.completionPct}%</div>
                <div className="showcase-stat__label">Completion rate</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Badges;
