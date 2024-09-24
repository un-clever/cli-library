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
 * - V: the type of the parsed command line flags, what they parse to be
 * - F: the type of the Flag (flag specification) Flag<F> = FT
 * - FF: the type of a Flagset (multiple flags specification)
 * - VV: "flags," the type that a flagset parses out to
 */

/**
 * A parse function takes a list of strings and the index of the element to
 * begin parsing at and attempts to parse a flag off the front of that list.
 * They can presum that the flag (e.g. --flag1) has already been removed from
 * the args list.
 *
 * If successful it returns [parsedValue: V, numberOfArgsConsumed: number].
 *
 * If unsuccessful, it returns [undefined, 0] and lets the higher-level parsing
 * loop decide what to do.
 */
export type ParseFunction<V> = (i: number, args: string[]) => {
  n: number; // the number of args consumed;
  value?: V; // the resultant value if success, otherwise undefined
};

/**
 * FlagParser is a ParseFunction (see above) and other metadata necessary to
 * parse a type of flag.
 *
 * .default = the default value for all flags of that type. This is NOT a
 * default value for a particular flag, but for a whole class of flags, like
 * boolean flags (which are presumed false if they don't appear).
 */

/** */
export interface FlagParser<V> {
  parse: ParseFunction<V>;
  default?: V;
  // preexecute?: (flagname: string, value: V) => Promise<void>;
  validate?: (value: unknown) => boolean;
}

/**
 * The specification for parsing a flag
 */
export interface BaseFlag<V> {
  // the long flag slug, e.g. "keep" for a flag named --keep
  name: string;
  description: string;
  // parser function
  parser: FlagParser<V>;
  // possible default value
  default?: V;
  // alternative slugs that should be prefixed with --
  aliases?: string[];
  // single character shortcuts to be prefixed with -
  shortcuts?: string;
}

/**
 * RequiredFlag asserts that the flag must be present in the command-line args
 * It will always infer it's parsed type as F
 */
export type RequiredFlag<V> = BaseFlag<V> & { required: true };

/**
 * OptionalFlag assets that the flag may be absent from the command-line args.
 * It will infer it's parsed type as F but it's allowable type as F | undefined.
 */
export type OptionalFlag<F> = BaseFlag<F> & { required: false };

export type Flag<V> = RequiredFlag<V> | OptionalFlag<V>;

/**
 * FlagType extracts the type a Flag's parser is expected to return.
 *
 * For those new to this format, see Typescript docs on conditional types.
 * To unpack the semantics:
 * 1. To get TypeFromFlag from any type
 * 2. If that type extends Flag, grab (infer) the type of flag it is.
 * 3. And if it doesn't extend Flag it's an error (should never happen)
 */
export type FlagType<F> = F extends Flag<infer V> ? V : never;

/**
 * FlagReturn takes into account that an optional flag might not appear
 * in the final flag results.
 */
export type FlagReturn<F> = F extends RequiredFlag<infer V> ? V
  : F extends OptionalFlag<infer V> ? V | undefined
  : never;

/**
 * Flagset is specification to document and parse a whole set
 * of named flags
 */
export type Flagset<VV> = {
  // "{} extends Pick<VV, K>" is an okay test for an optional props
  // creds to https://blog.beraliv.dev/2021-12-07-get-optional
  // deno-lint-ignore ban-types
  [K in keyof VV]-?: {} extends Pick<VV, K> ? OptionalFlag<Required<VV>[K]>
    : RequiredFlag<VV[K]>;
};

// export type Flagset = Record<string, Flag<unknown>>;
// TODO: I haven't found a way to express this yet
// and haven't had a need for it yet.
// export type Flagset<FF> = {
//   [K in keyof FF]: if FF<K> can be F | undefined ? OptionalFlag<F> : RequiredFlag<F>
// }

// export type FlagsetRequired<FST> = {
//   [K in keyof FST]: FST[K] extends BaseFlag<infer F> ? F : never;
// };

/**
 * FlagsetReturn extracts the interface of the complete parsed flags produced by
 * a flagset, treating OptionalFlag's as optional props.
 *
 * LATER: This type could be done more easily like this...
 *
 * type EasyFlagsetReturn<FF> = { [K in keyof FF]: FlagReturn<FF[K]> };
 *
 * ...which would probably be faster as well as simpler, but doesn't exactly
 * match optional types because a prop that can be absent isn't the same as a
 * prop that must be T | Undefined
 */
export type FlagsetReturn<FF> =
  & FlagsetOptionalProps<FF>
  & FlagsetRequiredProps<FF>;

// a couple helper types for FlagsetReturn
type FlagsetOptionalProps<FF> = {
  // uses "as" to remap/exclude keys that don't match a particular pattern
  // so we can add the "?:" optional token to the definition. There might
  // (someday) be a better way to do this conditionally and avoid the later
  // union type, but for now, it passes the tests.
  [K in keyof FF as FF[K] extends OptionalFlag<unknown> ? K : never]?:
    FF[K] extends OptionalFlag<infer V> ? V : never;
};
type FlagsetRequiredProps<FF> = {
  // uses "as" to remap/exclude keys that don't match a particular pattern
  [K in keyof FF as FF[K] extends RequiredFlag<unknown> ? K : never]:
    FF[K] extends RequiredFlag<infer V> ? V : never;
};

/**
 * CliArgs represents the results of successfully parsing a full
 * set of command-line arguments
 *
 * Some parsers may choose to handle -- differently, ignoring or failing,
 * but this structure makes space for those args to be returned.
 */
export interface CliArgs<VV> {
  args: string[]; // positional args
  dashdash: string[]; // args after --, useful mostly for commands that call another command
  flags: VV;
}
