import { FailedParse } from "../flags.ts";
import type { FlagParser } from "../types.ts";

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
