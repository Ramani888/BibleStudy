// Fire-and-forget achievement unlock check. Non-blocking and error-swallowing —
// it must never delay or break the user-facing action that triggered it.
// Dynamic import avoids any circular-import issues between modules.
export function triggerAchievementCheck(userId: string): void {
  import('../modules/achievements/achievements.service')
    .then(m => m.checkAchievements(userId))
    .catch(() => {});
}
