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
import { command } from "../../command.ts";
import { ParserExitCodes } from "../../errors.ts";
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
 * other sources, "args", the remaining positional args
 * @throws ParsingError if there's missing or invalid args, unrecognized flags
 */
type FlagsetParseFn<VV> = (
  flagset: Flagset<VV>,
  args: Args,
) => { partialFlags: Partial<VV>; args: Args };

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
  flags: VV,
  args: Args,
  std: StandardOutputs,
  command: LeafCommand<VV>,
  root?: MultiCommand,
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

type TraverseFn = (cmd: Command, raw: Args) => {
  path: string[]; // command path so far
  remaining: Args; // remaining raw args
  leaf: LeafCommand<unknown>; // this might have been swapped for Help
};

function dummy(...rest: unknown[]): unknown {
  return rest;
}

function isMulticommand(cmd: Command): cmd is MultiCommand {
  return "subcommands" in cmd;
}

async function runLeaf<VV>(cmd: LeafCommand<VV>, path: string[], raw: Args);

/**
 * The basic idea here is to separate concerns that were bundled into the Flag parser:
 *  - Traverse: detecting help or the executable command to be run.
 *  - Parse: parse the args into a partial structure and remaining positionals ()
 *  - Enrich: fill in the partial structure from defaults and other sources.
 *  - Validate: ensure no missing required args and handle any flag-particular pre-run concerns
 *
 * After that, it runs the command as before, except that we are withing a closure that can
 * send the root command and particular command to the runner.
 * @param cmd
 * @param raw
 * @param std
 * @param extraSources
 * @returns
 */
async function runCommand(
  cmd: Command,
  raw: Args,
  std: StandardOutputs,
  extraSources: FlagsetConfigFn[] = [],
): Status {
  try {
    const { path, remaining, leaf } = (dummy as TraverseFn)(cmd, raw);
    // if simple help requested, print and exit
    // PROBLEM: how to move to Generics now?
    // could I pass leaf into a generic function?
    const { parsedFlags, parsedArgs } = (dummy as FlagsetParseFn)(
      leaf.flagset,
      remaining,
    );
    const enrichedFlags = await (dummy as FlagsetEnrichFn)(
      parsedFlags,
      leaf.flagset,
      extraSources,
    );
    const { validFlags, validArgs } = await (dummy as FlagsetValidateFn)(
      enrichedFlags,
      parsedArgs,
      leaf.flagset,
    );
    const root = isMulticommand(cmd) ? cmd : undefined;
    const status = await leaf.handler(
      validFlags,
      validArgs,
      std,
      leaf,
      root,
    );
    return status;
  } catch (err) {
    console.error(err.message);
    return ParserExitCodes.UNKNOWN_ERROR;
  }
}
