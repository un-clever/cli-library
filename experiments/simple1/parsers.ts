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

export const dateFlag: FlagParser<Date> = (args: string[]) => {
  const value = new Date(args[0]);
  if (value + "" === "Invalid Date") return { tail: args };
  return { value, tail: args.slice(1) };
};
