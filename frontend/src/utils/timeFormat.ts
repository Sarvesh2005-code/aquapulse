/**
 * Indian Standard Time (IST) & Relative Time Formatting Utilities
 */

/**
 * Formats an ISO timestamp or Date object into a readable IST time string.
 * Example: "26 Oct 2026, 09:45:12 AM"
 */
export function formatIST(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'No timestamp';
  const date = typeof timestamp === 'string' ? new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z') : timestamp;
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats time only in IST (12-hour with seconds).
 * Example: "09:45:12 AM"
 */
export function formatISTTimeOnly(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return '--:--:--';
  const date = typeof timestamp === 'string' ? new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z') : timestamp;
  if (isNaN(date.getTime())) return '--:--:--';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculates a live relative time string (e.g. "Just now", "14s ago", "2m ago")
 */
export function formatRelativeTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'Never';
  const date = typeof timestamp === 'string' ? new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z') : timestamp;
  if (isNaN(date.getTime())) return 'Never';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';
  
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Checks if a telemetry reading is considered live / online (within threshold, default 30s)
 */
export function isHardwareConnected(timestamp: string | Date | null | undefined, thresholdSec = 30): boolean {
  if (!timestamp) return false;
  const date = typeof timestamp === 'string' ? new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z') : timestamp;
  if (isNaN(date.getTime())) return false;
  const diffSec = (Date.now() - date.getTime()) / 1000;
  return diffSec >= 0 && diffSec <= thresholdSec;
}
