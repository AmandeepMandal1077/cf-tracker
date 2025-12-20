/**
 * Get the Codeforces-style rating color based on rating value
 * Returns only the text color class (no background or border)
 *
 * Rating Ranges:
 * < 1200: Gray
 * 1200 - 1399: Green
 * 1400 - 1599: Cyan
 * 1600 - 1899: Blue
 * 1900 - 1999: Purple
 * 2000 - 2199: Orange
 * >= 2200: Red
 */
export function getRatingColor(rating: number | null): string {
  if (!rating) return "text-gray-400";
  if (rating < 1200) return "text-gray-400";
  if (rating < 1400) return "text-green-500";
  if (rating < 1600) return "text-cyan-400";
  if (rating < 1900) return "text-blue-500";
  if (rating < 2000) return "text-purple-500";
  if (rating < 2200) return "text-orange-500";
  return "text-red-600";
}

/**
 * Get the full badge styling for a rating (background + border + text)
 * Used internally for badge backgrounds in the UI
 */
export function getRatingBadgeClass(rating: number | null): string {
  if (!rating)
    return "bg-neutral-900/50 text-neutral-400 border-neutral-700/50";
  if (rating < 1200) return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  if (rating < 1400)
    return "bg-green-500/10 text-green-500 border-green-500/20";
  if (rating < 1600) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  if (rating < 1900) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (rating < 2000)
    return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  if (rating < 2200)
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  return "bg-red-600/10 text-red-600 border-red-600/20";
}
