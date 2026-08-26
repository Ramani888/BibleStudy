import i18n from '../i18n';

/**
 * Format a date string to a human-readable relative time or date.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return i18n.t('common:time.today', 'Today');
  if (diffDays === 1) return i18n.t('common:time.yesterday', 'Yesterday');
  if (diffDays < 7) return i18n.t('common:time.daysAgo', { count: diffDays, defaultValue: `${diffDays} days ago` });

  return date.toLocaleDateString(i18n.language || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Today · 3:45 PM", "Yesterday · 9:00 AM", "Aug 5 · 2:30 PM" */
export function formatDateWithTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString(i18n.language || 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffDays === 0) return `${i18n.t('common:time.today', 'Today')} · ${time}`;
  if (diffDays === 1) return `${i18n.t('common:time.yesterday', 'Yesterday')} · ${time}`;
  const day = date.toLocaleDateString(i18n.language || 'en-US', { month: 'short', day: 'numeric' });
  return `${day} · ${time}`;
}

/**
 * Format bytes to human-readable storage size.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats a date string as a readable date + time string.
 * e.g. "May 16, 2026 at 3:45 PM"
 */
export function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString(i18n.language || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
    ` ${i18n.t('common:time.at', 'at')} ` +
    date.toLocaleTimeString(i18n.language || 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

/**
 * Formats a date string as date only (no time).
 * e.g. "May 16, 2026"
 */
export function formatDateOnly(dateString: string | Date): string {
  return new Date(dateString).toLocaleDateString(i18n.language || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** "2m 34s", "1h 02m", "45s" */
export function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Truncate a string to maxLength and append ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}
