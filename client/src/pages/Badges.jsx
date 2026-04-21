// Challenge list + badge grid; progress helpers live in ../lib/badgeProgress.js (Profile imports the same module).
// fetch(): https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
import { useEffect, useMemo, useState } from 'react';
import { CHALLENGES } from '../data/challenges';
import {
  buildStats,
  countFullyCompleted,
  evaluateChallenges,
  getCompletedTriviaIds,
} from '../lib/badgeProgress';
import { apiUrl } from '../apiBase';
import './Badges.css';

function Badges() {
  const [landmarks, setLandmarks] = useState([]);
  const [trivia, setTrivia] = useState([]);
  const [completedTriviaIds, setCompletedTriviaIds] = useState(() =>
    getCompletedTriviaIds(),
  );

  // Fetch landmarks and trivia from API on mount
  // fetch docs: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  useEffect(() => {
    fetch(apiUrl('/api/landmarks'))
      .then((r) => r.json())
      .then(setLandmarks)
      .catch(() => {});
    fetch(apiUrl('/api/trivia'))
      .then((r) => r.json())
      .then(setTrivia)
      .catch(() => {});
  }, []);

  // Re-read completed trivia when auth storage changes (Map page, other tabs, same-tab event)
  useEffect(() => {
    const refresh = () => setCompletedTriviaIds(getCompletedTriviaIds());
    window.addEventListener('storage', refresh);
    window.addEventListener('openworld-auth-user', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('openworld-auth-user', refresh);
    };
  }, []);

  // Evaluate progress for every challenge
  const progressMap = useMemo(
    () => evaluateChallenges(CHALLENGES, landmarks, trivia, completedTriviaIds),
    [landmarks, trivia, completedTriviaIds],
  );

  // Count how many challenges are fully done → drives badge unlocks
  const fullyCompleted = useMemo(
    () => countFullyCompleted(progressMap),
    [progressMap],
  );

  const stats = useMemo(() => buildStats(fullyCompleted), [fullyCompleted]);

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
              {CHALLENGES.map((c) => {
                const prog = progressMap.get(c.id) || { completed: 0, total: 0 };
                const done = prog.total > 0 && prog.completed >= prog.total;
                return (
                  <div
                    key={c.id}
                    className={`challenge-item${done ? ' challenge-item--done' : ''}`}
                    role="listitem"
                  >
                    <div className="challenge-item__header">
                      <div className="challenge-item__name">{c.name}</div>
                      <div className="challenge-item__progress">
                        {prog.completed}/{prog.total}
                      </div>
                    </div>
                    <div className="challenge-item__desc">{c.description}</div>
                  </div>
                );
              })}
            </div>

            <div className="showcase-stat-row showcase-stat-row--duo">
              <div className="showcase-stat">
                <div className="showcase-stat__value">{fullyCompleted}</div>
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
