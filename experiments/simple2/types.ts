/**
 * Types for command-line parsing and execution.
 *
 * There are a lot of lines here, and a lot of comments explaining them, but
 * they generate no executable code except for the extended error class near the
 * top.
 *
 * # Overview
 *
 * The core types/jargon to understand are:
 *
 * 1. CLI: a command-line program.
 * 2. Flag: the specification to document, identify, and parse a named
 *    single CLI flag
 * 3. Flagset: the specification to document and parse a whole set
 *    of named flags
 * 4. Positionals: CLI arguments identified by their position, not
 *    a named flag.
 * 5. Command: the specification to document and run a simple command
 *    that may have flags and positionals
 * 6. MultiCommand: the specification for an executable that can have
 *    several levels of subcommands, each which is, on it's own,
 *    a valid Command
 *
 * # Conventions
 *
 * I try to use these generic type abbreviations to mean:
 *
 * - F: the type of the parsed command line flags, what they parse to be
 * - FT: the type of the Flag (flag specification) Flag<F> = FT
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
 * FlagParsers take a list of strings and attempt to parse a flag off the front
 * of it They can presume that they receive all the args AFTER the flag, that
 * is, the flag is already stripped off.
 *
 * FlagParsers can simply be functions, but for boolean types (and maybe others)
 * there has to be a default to make the parser work, hence .default.
 *
 * This concept is powerful, but precise. It's expected that the parser will:
 *
 * 1. always return tail, a list of args it hasn't consumed.
 * 2. if tail === [], we've parsed all the args
 * 3. if we couldn't parse a value, though that's probably an error, we'll
 *    just set .value to undefined and let the higher-up parsing loop
 *    decide how to handle it.
 * 4. throw an Error if there's a reason to stop all parsing (other than #3)
 */
export interface FlagParser<F> {
  (args: string[]): { tail: string[]; value?: F };
  default?: F; // mostly used for boolean flags, that must have a default value
}

/**
 * The specification for parsing a flag
 */
export interface Flag<F> {
  // the long flag slug, e.g. "keep" for a flag named --keep
  name: string;
  description: string;
  // parser function
  parser: FlagParser<F>;
  // possible default value
  default?: F;
  // truthy if it's an error not to supply a value for this flag
  // ignored if there's a .default
  required?: boolean;
  // fancy stuff
  // alternative slugs that should be prefixed with --
  aliases?: string[];
  // single character shortcuts to be prefixed with -
  shortcuts?: string;
}

// Helpers to identify Required and optional Flags
export type Required<T extends { required?: true }> = T;
export type Optional<T extends { required?: false | undefined }> = T;
// this just operates on a prop value
export type MakeOptional<V> = V | undefined; // optional props don't typetest right

/**
 * FlagType extracts the type a Flag's parser is expected to return.
 *
 * For those new to this format, see Typescript docs on conditional types.
 * To unpack the semantics:
 * 1. To get TypeFromFlag from any type
 * 2. If that type extends Flag, grab (infer) the type of flag it is.
 * 3. And if it doesn't extend Flag it's an error (should never happen)
 */
// export type FlagType<F> = F extends Flag<infer T> ? T : never;
export type FlagType<FT> = FT extends Flag<infer F>
  ? (FT extends { required: true } ? F : undefined | F)
  : never;

/**
 * Flagset is specification to document and parse a whole set
 * of named flags
 */
// export type FlagSet<
