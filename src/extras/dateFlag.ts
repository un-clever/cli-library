import { FailedParse } from "../flags.ts";
import type { FlagType } from "../types.ts";

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
const _dateFlag: FlagType<Date> = {
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
