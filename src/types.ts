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
 * copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface Writer {
  write(p: Uint8Array): Promise<number>;
}

/**
 * OutsFn ("Out String Function") is any async command that can take a string
 * and output it somewhere, typically stdout.
 */
export type OutsFn = (message: string) => Promise<void>;

/**
 * CLI's have to interact with terminals and piping. Splitting program output
 * from error output solves [The
 * Semi-PredicateProblem](https://en.wikipedia.org/wiki/Semipredicate_problem)
 * in an elegant and standard way. See also the [Wikipedia entry on Standard
 * Streams](https://en.wikipedia.org/wiki/Standard_streams), especially the
 * section for Standard Error.
 *
 * Yet runtimes, OS's, and compiled libraries are notorious for inconsistent
 * handling of these. Injecting this simple structure into each command tries
 * to sidestep most of those inconsistencies and encourage (or at least
 * not discourage) best practices.
 */
export type StandardOutputs = {
  /**
   * outs: "output String" writes a string to an app's main output stream
   */
  outs: OutsFn;
  /**
   * errs: "error String" writes a string to an app's error stream
   */
  errs: OutsFn;
};

/**
 * ParseFn: a function that can parse a particular flag type.
 *
 * # KEY CONCEPT: (i: number, args: string[]) => Value + N
 *
 * Flag types are extensible. At their core, each type of command-line flags are
 * implemented by functions that:
 *
 * 1. EXPECTS a position (integer > 0) and a list of strings (`i` and `args`).
 * 2. ATTEMPTS to parse a value starting at `args[i]`.
 * 3. If SUCCESSFUL, returns the value and how many strings it consumed `{n, value}`.
 * 4. If UNSUCCESSFUL, returns `{n: 0}` (leaving `value` undefined).
 * 5. NEVER THROWS and exception.
 * 6. NEVER looks backward (at `arg[<i]`) because it might be receiving only a
 *    slice of the command line args
 *
 * NOTE: these functions just parse values; they assume that any flag token, like `--some-flag`,
 * has already been parsed.
 */
export type ParseFn<V> = (
  i: number,
  args: string[],
) => ParseResult<V>;

/**
 * ParseResult: every type of flag has a function that can attempt to
 * parse a value of its type off the front of a list of strings.
 */
export type ParseResult<V> = {
  n: number; // the number of args consumed;
  value?: V; // the resultant value if success, otherwise undefined
};

/**
 * FlagtypeDef(inition) is a ParseFunction (see above) and other metadata necessary to
 * parse a type of flag.
 *
 * .default = the default value for all flags of that type. This is NOT a
 * default value for a particular flag, but for a whole class of flags, like
 * boolean flags (which are presumed false if they don't appear).
 */

/** */
export interface FlagtypeDef<V> {
  parse: ParseFn<V>;
  default?: V;
  // preexecute?: (flagname: string, value: V) => Promise<void>;
  validate?: (value: unknown) => boolean;
}

/**
 * BaseFlag: is the core data necessary to define a particular flag
 */
export interface BaseFlag<V> {
  // the long flag slug, e.g. "keep" for a flag named --keep
  name: string;
  // brief help for the flag
  description: string;
  // parser function
  parser: FlagtypeDef<V>;
  // possible default value
  default?: V;
  // alternative slugs that should be prefixed with --
  aliases?: string[]; // RESERVED: on the roadmap
  // single character shortcuts to be prefixed with -
  shortcuts?: string; // RESERVED: on the roadmap
}

/**
 * RequiredFlag asserts that the flag MUST BE PRESENT in the command-line args.
 * It will always infer it's parsed type as V and require the flag to appear
 * in the CLI args unless a default is provided.
 *
 * NOTE: RequiredFlag and OptionalFlag (below) are discriminated unions of BaseFlag
 * that exist to help strongly type parsings of command lines. They correspond
 * with whether or not the flag is an optional property of the parse result.
 *
 * Therefore, required flags MAY have a default. The semantic of required flags
 * is only that a successfully parsed CLI with that flag will always have a
 * value for that flag, i.e. it's a *required* property of the flagset parse.
 */
export type RequiredFlag<V> = BaseFlag<V> & { required: true };

/**
 * OptionalFlag assets that the flag MAY BE ABSENT from the command-line args.
 * It will infer it's parsed type as V but allow the flag to NOT appear in the
 * CLI args.
 *
 * NOTE that optional flags MAY have a default. The semantic of optional
 * flags is that a successfully parsed CLI with that flag could have the value
 * of undefined, i.e. it's an *optional* property of the flagset parse, so code
 * will have to test for a real value before using the flag. You can do away
 * with such tests by using a RequiredFlag with a default. Defaults are
 * permitted on OptionalFlags too because of the reality that developers
 * sometimes add convenience defaults to CLI's and may want to have the compiler
 * check for nullish tests in case they later remove those defaults.
 */
export type OptionalFlag<F> = BaseFlag<F> & { required: false };

/**
 * Flag is the discriminated union describing any named CLI flag.
 */
export type Flag<V> = RequiredFlag<V> | OptionalFlag<V>;

/**
 * FlagValue extracts the type a Flag's parser is expected to return.
 *
 * If this code seems unfamiliar, see Typescript docs on conditional types.
 * It basically means:
 *
 * 1. To get TypeFromFlag from any type:
 * 2. If that type extends Flag, grab (infer) the type of flag it is.
 * 3. And if it doesn't extend Flag it's an error (should never happen)
 */
export type FlagValue<F> = F extends Flag<infer V> ? V : never;

/**
 * FlagReturn is like FlagValue but takes into account that an optional flag
 * might not appear in the final flag results.
 */
export type FlagReturn<F> = F extends RequiredFlag<infer V> ? V
  : F extends OptionalFlag<infer V> ? V | undefined
  : never;

/**
 * Flagset is specification to document and parse a whole set
 * of named flags
 *
 * IMPLEMENTATION:
 * "{} extends Pick<VV, K>" is an okay test for an optional props (thanks to
 * https://blog.beraliv.dev/2021-12-07-get-optional). Without the special
 * comment below, lint will remind us of the non-intuitive fact `{}` doesn't
 * mean an empty object, but means any types other than `null` and `undefined`.
 */
export type Flagset<VV> = {
  // deno-lint-ignore ban-types
  [K in keyof VV]-?: {} extends Pick<VV, K> ? OptionalFlag<Required<VV>[K]>
    : RequiredFlag<VV[K]>;
};

/**
 * FlagsetReturn extracts the interface of the complete parsed flags produced by
 * a flagset, treating OptionalFlag's as optional props.
 *
 * IMPLEMENTATION: This type could be done more easily like this...
 *
 * `type EasyFlagsetReturn<FF> = { [K in keyof FF]: FlagReturn<FF[K]> };`
 *
 * ...which would probably be faster as well as simpler, but doesn't exactly
 * match optional types because a prop that can be absent isn't the same as a
 * prop that must be T | Undefined.
 *
 * This is a common typing problem and may be solved someday with conditional
 * typing of the optional property flag. As of Sep 2024, the only solution I've
 * found is this union type.
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
 * ParsedArgs represents the results of successfully parsing a full set of
 * command-line arguments.
 */
export interface ParsedArgs<VV> {
  args: string[]; // positional args
  flags: VV; // if exit code exists, this may be partial or invalid
  exitCode?: number; // if exists, means exit with code (0=clean), flags and args undefined (likely invalid)
}

export type HelpFn = (path?: string[]) => string;

/**
 * FlagsetParseFn supports a CLI by converting the raw args into a parsed
 * structure taking into account positional arguments optional, required, and
 * default flags,
 */
export type FlagsetParseFn<VV> = (args: string[]) => ParsedArgs<VV>;

/**
 * CommandFn is a function which implements (executes a command).
 */
export type CommandFn<VV> = (
  flags: VV,
  args: string[],
  std: StandardOutputs,
) => Promise<number>;

/**
 * Command is the functional interface to a CLI program
 */
export interface Command {
  describe: () => string;
  help: (path?: string[]) => string;
  helpDeep: (
    path: string[],
  ) => { path: string[]; children: CommandMap | Flagset<unknown> };
  run: (
    rawArguments: string[],
    std: StandardOutputs,
  ) => Promise<number>;
}

export type CommandMap = Record<string, Command>;
