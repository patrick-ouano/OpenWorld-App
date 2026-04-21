/** Profile heading: legacy accounts may have fullName; new signups use username only. */
export function getProfileDisplayName(user) {
  if (!user || typeof user !== 'object') return 'Explorer';
  const full = String(user.fullName ?? '').trim();
  const handle = String(user.username ?? '').trim();
  return full || handle || 'Explorer';
}
