/**
 * Types for command-line parsing and execution.
 *
 * There are a lot of lines here, and a lot of comments explaining them, but
 * they generate no executable code.
 *
 * # Overview
 *
 * The core types to understand are:
 *
 * # Conventions
 *
 * I try to use these generic type abbreviations to mean:
 *
 * - F: the type of the parsed command line flags
 */

/**
 * ParsedArgs represents the results of successfully parsing a full
 * set of command-line arguments
 */
export interface CliArgs<F> {
  args: string[]; // positional args
  rest: string[]; // args after --
  flags: F;
}

/**
 * The result of attempting to parse a param from CLIArgs
 */
export type MaybeParam<F> =
  | undefined
  | // could not parse arguments necessary for thew flag's value
  F; // successfully parsed the flag
// throw a Parsing error if there's a game stopper besides couldn't parse

/**
 * FlagParsers take a list of strings and attempt to parse a flag off the front
 * of it They can presume that they receive all the args AFTER the flag, that
 * is, the flag is already stripped off.
 *
 * FlagParsers can simply be functions, but for boolean types (and maybe others)
 * there has to be a default to make the parser work, hence .default
 */
export interface FlagParser<T> {
  (args: string[]): MaybeParam<T>;
  default?: T; // mostly used for boolean flags, that must have a default value
}
