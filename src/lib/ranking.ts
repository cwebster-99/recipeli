/**
 * Binary-search comparison engine for Beli-style pairwise ranking.
 *
 * When a newly-cooked recipe needs to be placed into an existing ranked list,
 * the algorithm performs a binary search: at each step the user picks between
 * the new recipe and the recipe at the midpoint of the current search window.
 * After ceil(log2(n)) comparisons the insertion position is determined.
 */

/**
 * Return the next index in the ranked list to compare against,
 * or null when the search is complete and `low` is the insertion position.
 */
export function nextComparisonIndex(low: number, high: number): number | null {
  if (low >= high) return null;
  return Math.floor((low + high) / 2);
}

/**
 * After the user makes a choice, narrow the search window.
 * @param preferNew `true` when the user preferred the new recipe over the
 *   opponent at `midIndex`.
 */
export function updateBounds(
  low: number,
  high: number,
  midIndex: number,
  preferNew: boolean
): { low: number; high: number } {
  return preferNew
    ? { low, high: midIndex }
    : { low: midIndex + 1, high };
}

/**
 * Estimate the total number of comparisons needed for a list of the given
 * length.  Returns 0 when the list is empty (recipe auto-ranks at #1).
 */
export function estimateComparisons(listLength: number): number {
  if (listLength <= 0) return 0;
  return Math.ceil(Math.log2(listLength + 1));
}
