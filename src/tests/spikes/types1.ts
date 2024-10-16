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
import { ParserExitCodes } from "../../errors.ts";
import type { Flagset, StandardOutputs } from "../../types.ts";

export type Args = string[];
export type SubcommandPath = string[];
export type Status = Promise<number>; // cliu status code

// maybe use the prefix for Flag and no prefix means Flagset
// no messages means continue, anything else means abort with message
export type FlagValidateFn<V> = (
  candidate: V,
  command?: unknown,
) => Promise<string[]>;

/**
 * ParseFn is a function that parses flag
 * @param flagset the flag definitions to parse structured args (VV) from raw
 * set of command line args.
 * @param args the raw args that will be parsed
 * @returns "flags", a partial VV that may need to fill in missing values from
 * other sources, "args", the remaining positional args
 * @throws ParsingError if there's missing or invalid args, unrecognized flags
 */
export type ParseFn<VV> = (
  flagset: Flagset<VV>,
  args: Args,
) => { parsedFlags: Partial<VV>; parsedArgs: Args };

/**
 * ConfigFn represents any alternative configuration source, such as environment
 * variables, configuration files, even configuration servers.
 */
export type ConfigFn = (key: string) => Promise<Args>;

/**
 * EnrichFn take the partial structured flag value parsed from some command-line argument,
 * grabs values from any alternate config source and defaults
 */
export type EnrichFn<VV> = (
  candidate: Partial<VV>,
  flagset: Flagset<VV>,
  sources: ConfigFn[],
) => Promise<Partial<VV>>;

/**
 * ValidateFn makes sure all required arguments are present then runs any extra
 * validation a flag type may require. This may invoke confirmation, authorization,
 * or other checks.
 */
export type ValidateFn<VV> = (
  candidate: Partial<VV>,
  args: Args,
  flagset: Flagset<VV>,
) => Promise<{ validFlags: VV; validArgs: Args }>;

export type LeafHandler<VV> = (
  flags: VV,
  args: Args,
  std: StandardOutputs,
  path: string[],
  command: LeafCommand<VV>,
  root?: MultiCommand,
) => Status;

export interface BaseCommand {
  name: string;
  description: string; // short, one line
  instructions: string; // longer help, Markdown
}

export interface LeafCommand<VV> extends BaseCommand {
  flagset: Flagset<VV>;
  argset: string[]; // documentation for positional args TODO format for optional and rest?
  handler: LeafHandler<VV>;
}

export type Subcommands = {
  [name: string]: Command;
};

export interface MultiCommand extends BaseCommand {
  subcommands: Subcommands;
}

export type Command = LeafCommand<unknown> | MultiCommand;

export type TraverseFn = (cmd: Command, raw: Args) => {
  path: string[]; // command path so far
  remaining: Args; // remaining raw args
  leaf: LeafCommand<unknown>; // this might have been swapped for Help
  help: boolean;
};

function dummy(...rest: unknown[]): unknown {
  return rest;
}

function isMulticommand(cmd: Command): cmd is MultiCommand {
  return "subcommands" in cmd;
}

async function runLeaf<VV>(
  cmd: LeafCommand<VV>,
  path: string[],
  raw: Args,
  std: StandardOutputs,
  extraSources: ConfigFn[] = [],
  root?: MultiCommand,
): Status {
  // PROBLEM: how to move to Generics now?
  // could I pass leaf into a generic function?
  const { parsedFlags, parsedArgs } = (dummy as ParseFn<VV>)(
    cmd.flagset,
    raw,
  );
  const enrichedFlags = await (dummy as EnrichFn<VV>)(
    parsedFlags,
    cmd.flagset,
    extraSources,
  );
  const { validFlags, validArgs } = await (dummy as ValidateFn<VV>)(
    enrichedFlags,
    parsedArgs,
    cmd.flagset,
  );
  return await cmd.handler(
    validFlags,
    validArgs,
    std,
    path,
    cmd,
    root,
  );
}

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
