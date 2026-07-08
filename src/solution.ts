/**
 * Code-challenge scratchpad.
 * Replace `solve` with the actual exercise during the interview.
 *
 * Sample below: return the two indices whose values add up to `target`.
 * O(n) time, O(n) space.
 */
export function solve(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
