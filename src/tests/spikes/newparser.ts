/**
 * NewParser Type Experiment
 * Trying a more discretized approach to cli prep.
 *
 * Given a cli specification and some args, what has to happen?
 *
 * Check for help
 *  - if it's a multicommand, traverse down if command is help, JMP HELP
 *  - if --help is requested, set context and JMP HELP
 * Parse the arguments
 *  - ERROR if the args are invalid
 * - Filling in missing args from
 *   - ENV vars
 *   - Config files
 *   - Config services
 *   - defaults
 * - Validate the args
 *  - ERROR if missing required args
 *  - Validation can except or just halt
 * - HELP: If help is requested, it's like a command, but it can introspect
 * - Run the command
 * - Report errors and exit.
 */
import type { Flagset, StandardOutputs } from "../../types.ts";

type Args = string[];
type Status = Promise<number>; // cliu status code

// maybe use the prefix for Flag and no prefix means Flagset
// no messages means continue, anything else means abort with message
type FlagValidateFn<V> = (candidate: V, command?: unknown) => Promise<string[]>;

/**
 * FlagsetParseFn is a function that parses flag
 * @param flagset the flag definitions to parse structured args (VV) from raw
 * set of command line args.
 * @param args the raw args that will be parsed
 * @returns "flags", a partial VV that may need to fill in missing values from
 * other sources, "args", the remaining positional args, and, potentially,
 * "help" which means flags and args are in an indeterminate state and the
 * CLI explicitly requested help
 * @throws ParsingError if there's missing or invalid args, unrecognized flags
 */
type FlagsetParseFn<VV> = (
  flagset: Flagset<VV>,
  args: Args,
) => { flags: Partial<VV>; args: Args; help?: boolean };

/**
 * FlagsetConfigFn represents any alternative configuration source, such as environment
 * variables, configuration files, even configuration servers.
 */
type FlagsetConfigFn = (key: string) => Promise<Args>;

/**
 * FlagsetEnrichFn take the partial structured flag value parsed from some command-line argument,
 * grabs values from any alternate config source and defaults
 */
type FlagsetEnrichFn<VV> = (
  candidate: Partial<VV>,
  flagset: Flagset<VV>,
  sources: FlagsetConfigFn[],
) => Promise<Partial<VV>>;

/**
 * FlagsetValidateFn makes sure all required arguments are present then runs any extra
 * validation a flag type may require. This may invoke confirmation, authorization,
 * or other checks.
 */
type FlagsetValidateFn<VV> = (
  candidate: Partial<VV>,
  args: Args,
  flagset: Flagset<VV>,
) => Promise<{ flags: VV; args: Args }>;

type LeafHandler<VV> = (
  flagset: Flagset<VV>,
  std: StandardOutputs,
  raw: Args,
  command: LeafCommand<VV>,
  // parent: unknown,
) => Status;

interface BaseCommand {
  name: string;
  description: string; // short, one line
  instructions: string; // longer help, Markdown
}

interface LeafCommand<VV> extends BaseCommand {
  flagset: Flagset<VV>;
  argset: string[]; // documentation for positional args TODO format for optional and rest?
  handler: LeafHandler<VV>;
}

type Subcommands = {
  [name: string]: Command;
};

interface MultiCommand extends BaseCommand {
  subcommands: Subcommands;
}

type Command = LeafCommand<unknown> | MultiCommand;
