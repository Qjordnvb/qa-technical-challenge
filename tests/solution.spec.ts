import { test, expect } from '@playwright/test';
import { solve } from '../src/solution';

/**
 * Algorithm/code-challenge checks.
 * Run with: npm run test:unit
 * (Uses Playwright's runner purely as a TS test harness — no browser is launched.)
 */

test('finds the two indices that sum to target', () => {
  expect(solve([2, 7, 11, 15], 9)).toEqual([0, 1]);
});

test('works with a match later in the array', () => {
  expect(solve([3, 2, 4], 6)).toEqual([1, 2]);
});

test('returns empty when no pair matches', () => {
  expect(solve([1, 2, 3], 100)).toEqual([]);
});
