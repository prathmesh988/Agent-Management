/**
 * Avatar utility functions for displaying user initials and colors
 */

/**
 * Get initials from a person's name
 * @example getInitials('John Doe') => 'JD'
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase())
    .filter(Boolean)
    .join('')
    .slice(0, 2);
}

/**
 * Get a consistent color class for an avatar based on index
 * Uses a cycle of 5 distinct Tailwind colors
 */
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
] as const;

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/**
 * Get avatar color by a stable string hash
 * Useful for consistent colors based on IDs
 */
export function getAvatarColorByHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
