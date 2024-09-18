import type { FlagParser } from "./flags.ts";

export const stringFlag: FlagParser<string> = (args: string[]) => {
  if (args.length < 1) return { tail: args };
  return { value: args[0], tail: args.slice(1) };
};

export const numberFlag: FlagParser<number> = (args: string[]) => {
  const value = parseFloat(args[0]);
  if (isNaN(value)) return { tail: args };
  return { value, tail: args.slice(1) };
};

/**
 * If we get here, the flag is present and already stripped off, so return true
 * boolean flags always default false
 * @param args
 * @returns
 */
export const booleanFlag: FlagParser<boolean> = (args: string[]) => {
  return { value: true, tail: args };
};

export const integerFlag: FlagParser<number> = (args: string[]) => {
  const value = parseInt(args[0]);
  if (isNaN(value)) return { tail: args };
  return { value, tail: args.slice(1) };
};

export const dateFlag: FlagParser<Date> = (args: string[]) => {
  const value = new Date(args[0]);
  if (value + "" === "Invalid Date") return { tail: args };
  return { value, tail: args.slice(1) };
};
