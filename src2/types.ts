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
