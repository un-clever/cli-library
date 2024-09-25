import type { FlagParser } from "./types.ts";

export const FailedParse = { n: 0 };

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
