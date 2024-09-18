/**
 * Failable is used for are parsing final and intermediate results. Given a
 * type, it can hold the resulting value, more args to parse if there are any,
 * and rich failure information if there was a problem.
 */
export interface Failable<V> {
  value?: V; // the resultant value or undefined if it failed to parse
  tail: string[]; // 0..N further args to parse
  failure?: Error; // the error if there was one
  advice?: string; // further advice on eliminating any problems
}

/**
 * @param result: a Fallible value
 * @returns the error if there was one, otherwise undefined
 */
export function hasFailed(result: Failable<unknown>): false | Error {
  return (!!result.failure) && result.failure;
}

/**
 * @param result: a Fallible value
 * @returns advice for correcting errors, empty string if there is none
 */
export function hasAdvice(result: Failable<unknown>): string {
  return result.advice || "";
}

/**
 * @param result: a Fallible value
 * @returns true if the there's nothing left to parse (.tail is empty)
 */
export function hasCompleted(result: Failable<unknown>): boolean {
  return result.tail.length < 1;
}

/**
 * @param result: a Fallible value
 * @returns true if there was a successful parse of a value we don't return the value
 * because it might be null or false
 */
export function hasSuccess(result: Failable<unknown>): boolean {
  return (!result.failure) && !!result.value;
}
