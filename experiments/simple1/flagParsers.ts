import type { FlagParser } from "./flags.ts";

/**
 * A normal boolean flag, false by default, true if it's present: e.g. --wrap.
 *
 * If you need fancier, default-true (negatable) flags (e.g. --no-wrap). See
 * falseFlag() below.
 *
 * @param args
 * @returns
 */
export const booleanFlag: FlagParser<boolean> = (args: string[]) => {
  // If we get here, the flag is present and already stripped off, so return true
  return { value: true, tail: args };
};
booleanFlag.default = false; // if it's not there, the flag is false

/**
 * A negatable boolean flag: e.g. --no-wrap
 *
 * Negatable flags can confuse users and developers, beware. True by default,
 * false if they're present.
 *
 * If you must have a default-true flag with a --no-destroy, either rephrase it
 * or, use this flag type. You could auto-populate it in your command factory
 * @param args
 * @returns
 */
export const negatedFlag: FlagParser<boolean> = (args: string[]) => {
  return { value: false, tail: args };
};
negatedFlag.default = true; // if it's not there, the flag is true

export const stringFlag: FlagParser<string> = (args: string[]) => {
  if (args.length < 1) return { tail: args };
  return { value: args[0], tail: args.slice(1) };
};

/**
 * Parse a decimal floating point number into a JavaScript number
 * @param args
 * @returns
 */
export const floatFlag: FlagParser<number> = (args: string[]) => {
  const value = parseFloat(args[0]);
  if (isNaN(value)) return { tail: args };
  return { value, tail: args.slice(1) };
};

/**
 * Parse a decimal integer into a JavaScript number
 * @param args
 * @returns
 */
export const intFlag: FlagParser<number> = (args: string[]) => {
  const value = parseInt(args[0]);
  if (isNaN(value)) return { tail: args };
  return { value, tail: args.slice(1) };
};

/**
 * Parse a string into a UTC date. See WARNING
 *
 * # Warning
 *
 * Use this at your own risk. See it mostly as an example of how one might
 * implement a more advanced parser.
 *
 * JavaScript date parsing is not robust, so neither is this flag parser.
 * This no-dependency core only uses `new Date(string)` to parse dates. maybe
 * once [temporal](https://tc39.es/proposal-temporal/docs/index.html) is
 * standardized, that may change.
 *
 * Meanwhile, there are plenty of edge cases to deal with:
 *
 * 1. MDN warns To offer protection against timing attacks and fingerprinting,
 *    the precision of new Date() might get rounded depending on browser
 *    settings.
 *
 * 2. The input may or may not enter a time zone. Currently, this library's
 *    behavior is: a. treat the input as if it were UTC b. ignore any time
 *    portion c. return a UTC timestamp with the time fields all 00 If you want
 *    to handle this explicitly, grab it as a string arg and further parse it
 *    yourself.
 *
 * Recommendation: keep inputs to YYYY-MM-DD and test thoroughly.
 *
 * @param args a string version of a date, preferably YYYY-MM-DD numeric
 * @returns a UTC timestamp with zeroed timefields
 */
export const dateFlag: FlagParser<Date> = (args: string[]) => {
  const test = new Date(args[0]);
  if (test + "" === "Invalid Date") return { tail: args };
  const value = new Date(
    test.getUTCFullYear(),
    test.getUTCMonth(),
    test.getUTCDate(),
  );
  return { value, tail: args.slice(1) };
};