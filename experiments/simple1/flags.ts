import type { Failable } from "./Failable.ts";

// The partial result for parsing a single flag
type FlagParseAttempt<T> = Failable<T>;

/**
 * FlagParsers take a list of strings and attempt to parse a flag off the front of it
 * They can presume that they receive all the args AFTER the flag,
 * that is, the flag is already stripped off
 */
export interface FlagParser<T> {
  (args: string[]): FlagParseAttempt<T>;
  default?: T; // mostly used for boolean flags, that must have a default value
}

/**
 * A flag that knows how to parse itself;
 */
export interface Flag<T> {
  description: string;
  slugs: string[]; // command names
  shortcuts: string[]; // single letter single dash shortcuts
  required?: boolean; // ignored if a default is provided
  default?: T;
  parser: FlagParser<T>;
}

/**
 * A utility type to grab the type from the flag
 *
 * For those new to this format, see Typescript docs on conditional types.
 * To unpack the semantics:
 * 1. To get TypeFromFlag from any type
 * 2. If that type extends Flag, grab (infer) the type of flag it is.
 * 3. And if it doesn't extend Flag it's an error (should never happen)
 */
export type TypeFromFlag<F> = F extends Flag<infer T> ? T : never;

/**
 * A utility type to grab the type from a flag parser
 */
export type TypeFromFlagParser<F> = F extends FlagParser<infer T> ? T : never;

/**
 * The common interface for building sets of flags for commands will be a
 * dictionary of Flag objects. This is the structure, but you probably don't
 * want to type those constants because this type tag will tend to de-specify
 * the types.
 *
 * Instead, write the flag spec as a constant, then use the FlagsType utility
 * below to extract the types
 */
// deno-lint-ignore no-explicit-any
export type UntypedFlagSpec = Record<string, Flag<any>>;

/**
 * If you want to explicitly type the flag spec, you could do it. See example in the tests file.
 */
export type FlagSpec<F> = {
  [K in keyof F]: K extends string ? Flag<F[K]> : never;
};

/**
 * A utility to infer the type of a group of parsed flags resulting from a
 * applying a flag spec to args.
 */
export type FlagsType<FS> = {
  [K in keyof FS]: FS[K] extends Flag<infer T> ? T : never;
};
