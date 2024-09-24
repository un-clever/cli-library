import type { FlagParser } from "./types.ts";

const FailedParse = { n: 0 };

/**
 * A normal boolean flag, false by default, true if it's present: e.g. --wrap.
 *
 * If you need fancier, default-true (negatable) flags (e.g. --no-wrap). See
 * falseFlag() below.
 */
export const booleanFlag: FlagParser<boolean> = {
  parse(_i: number, _: string[]) {
    // If we get here, the flag is present and already stripped off, so return true
    return { n: 0, value: true };
  },
  default: false, // if it's not there, the flag is false
};

/**
 * A negatable boolean flag: e.g. --no-wrap
 *
 * Negatable flags can confuse users and developers, beware. True by default,
 * false if they're present.
 *
 * IMO, If you must have a default-true flag with a --no-destroy, beset to
 * rephrase it if you can. But, here's a helpful type if you want it.
 */
export const negatedFlag: FlagParser<boolean> = {
  parse(_i: number, _: string[]) {
    return { n: 0, value: false }; // negated flags are true by default, false if present
  },
  default: true,
};

/**
 * Parse a string flag
 */
export const stringFlag: FlagParser<string> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = args[i];
    if (value) return { n, value };
    return FailedParse;
  },
};

/**
 * Parse a decimal floating point number into a JavaScript number
 */
export const floatFlag: FlagParser<number> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = parseFloat(args[i]);
    if (isNaN(value)) return FailedParse;
    return { n, value };
  },
};

/**
 * Parse a decimal integer into a JavaScript number
 */
export const intFlag: FlagParser<number> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const value = parseInt(args[i]);
    if (isNaN(value)) return FailedParse;
    return { n, value };
  },
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
// LATER: add this in a separate module as an test of extensibility
// there are some tests that might help in the accompanying test module
// currently commented out though
const _dateFlag: FlagParser<Date> = {
  parse(i: number, args: string[]) {
    const n = 1;
    const test = new Date(args[i]);
    if (test + "" === "Invalid Date") return FailedParse;
    const value = new Date(
      test.getUTCFullYear(),
      test.getUTCMonth(),
      test.getUTCDate(),
    );
    return { n, value };
  },
};
