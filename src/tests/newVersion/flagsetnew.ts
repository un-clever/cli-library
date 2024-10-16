// reimplementing command with hoses

import { ParserExitCodes, ParsingError } from "./errors.ts";
import { hose } from "./hoses.ts";
import type { Flagset, StandardOutputs } from "./types.ts";

export type Args = string[];
export type SubcommandPath = string[];
export type Status = Promise<number>; // cli status code

export interface BaseCommand {
  name: string;
  description: string; // short, one line
  instructions: string; // longer help, Markdown
}

export type LeafHandler<VV> = (
  flags: VV,
  args: Args,
  std: StandardOutputs,
  path: SubcommandPath,
  command: LeafCommand<VV>,
  root: Command, // might be same as .command if this is a simple CLI
) => Status;

export interface LeafCommand<VV> extends BaseCommand {
  flagset: Flagset<VV>;
  argset: string[]; // documentation for positional args TODO format for optional and rest?
  handler: LeafHandler<VV>;
}

export interface MultiCommand extends BaseCommand {
  subcommands: Record<string, Command>;
}

export type Command = LeafCommand<unknown> | MultiCommand;

export function isHelpFlag(a: string) {
  return ["-h", "--help"].includes(a);
}

export function isHelpCommand(a: string) {
  return isHelpFlag(a) || a === "help";
}

export function isMultiCommand(cmd: Command): cmd is MultiCommand {
  return "subcommands" in cmd;
}

export function isLeafCommand(cmd: Command): cmd is LeafCommand<unknown> {
  return "flagset" in cmd;
}

interface RunContext {
  done: boolean;
  exitCode: number; // if defined, stop and return this status
  std: StandardOutputs;
  root: Command; // might be a single or multi
  path: SubcommandPath;
  args: Args;
  argPos: number;
  leaf?: LeafCommand<unknown>;
}

interface LeafContext<VV> extends RunContext {
  command: LeafCommand<VV>;
  flagsP: Partial<VV>;
  flags?: VV;
}

function haltIf(ctx: RunContext) {
  return ctx.done;
}

const findLeafOrHelp = hose<RunContext>([
  findLeafCommand,
  // cf. src/tests/spikes/helpCommand1.ts and src/tests/spikes/helpCommand.ts
  // checkMultiCommandHelp and switch leaf handler to help handler
], haltIf);

async function runLeafOrHelp<VV>(ctx: LeafContext<VV>) {
  return await hose<LeafContext<VV>>([
    // cf. src/tests/spikes/newparser1.ts
    parseFlags,
    // check help
    enrichFlags,
    validateFlags,
    runLeaf,
  ], haltIf)(ctx);
}

export async function run(root: Command, args: Args, std: StandardOutputs) {
  const ctx = await findLeafOrHelp({
    done: false,
    exitCode: 0,
    std,
    root,
    path: [],
    args,
    argPos: 0,
  });

  if (ctx.leaf) {
    const finalContext = await runLeafOrHelp(
      { ...ctx, command: ctx.leaf, flagsP: {} } as LeafContext<unknown>,
    );
    return finalContext.exitCode;
  } else {
    return ctx.exitCode;
  }
}

function findLeafCommand(ctx: RunContext): RunContext {
  let cmd = ctx.root;
  let i = ctx.argPos;
  const path = ctx.path;
  while (i < ctx.args.length && isMultiCommand(cmd)) {
    const arg = ctx.args[i];
    // HELP
    if (isHelpCommand(arg)) {
      return { ...ctx, path, argPos: i /*TODO leaf: Help command*/ };
    }
    // ERROR: unrecognized subcommand
    if (!(arg in cmd.subcommands)) {
      return {
        ...ctx,
        done: true,
        path,
        argPos: i,
        exitCode: ParserExitCodes.UNRECOGNIZED_SUBCOMMAND,
      };
    }
    path.push(arg);
    cmd = cmd.subcommands[arg];
    i++;
  }
  // SUCCESS
  if (isLeafCommand(cmd)) return { ...ctx, argPos: i, leaf: cmd };
  // FAILURE: ran out of args before we got to a leaf command
  // TODO Unify better error returns
  return { ...ctx, done: true, exitCode: ParserExitCodes.MISSING_SUBCOMMAND };
}

function handleLongFlag<VV>(
  flagname: string,
  ctx: LeafContext<VV>,
): LeafContext<VV> {
  // TODO: handle if flagname is really flag=value
  const flagset = ctx.command.flagset;
  if (flagname in flagset) {
    const prop = flagname as keyof VV;
    const flag = flagset[prop];
    const { n, value } = flag.parser.parse(ctx.argPos, ctx.args);
    if (value !== undefined) {
      ctx.flagsP[prop] = value;
      ctx.argPos += n;
      return ctx;
    }
    throw new ParsingError(
      "missing arg",
      ParserExitCodes.INVALID_FLAG_ARGS,
      `the arguments '${args.slice(start)} didn't provide a valid value for`,
      flagname,
    );
  }
  throw new ParsingError(
    "unrecognized flag",
    ParserExitCodes.UNRECOGNIZED_FLAG,
    "",
    flagname,
  );
}

function parseFlags<VV>(ctx: LeafContext<VV>): LeafContext<VV> {
  let c = { ...ctx };
  const args: Args = []; //parsed args
  while (c.argPos < c.args.length) {
    if (haltIf(c)) return c;
    const arg = c.args[c.argPos++];
    if (arg.startsWith("--")) c = handleLongFlag(arg.slice(2), c);
    else if (arg.startsWith("-")) c = handleShortFlags(arg.slice(1), c);
    else args.push(arg);
  }
  return { ...c, args };
}

async function enrichFlags<VV>(ctx: LeafContext<VV>): Promise<LeafContext<VV>> {
  // can be used to add values to undefined flags
  // from ENV, config files, config service
  // Flag is really just one form of config
  return await Promise.resolve(ctx);
}

async function validateFlags<VV>(
  ctx: LeafContext<VV>,
): Promise<LeafContext<VV>> {
  // can be used to check async and late validation flags
  return await Promise.resolve(ctx);
}

async function runLeaf<VV>(
  ctx: LeafContext<VV>,
): Promise<LeafContext<VV>> {
  if (ctx.flags) {
    const exitCode = await ctx.command.handler(
      ctx.flags,
      ctx.args.slice(ctx.argPos),
      ctx.std,
      ctx.path,
      ctx.command,
      ctx.root,
    );
    return { ...ctx, exitCode };
  }
  // should never happen unless a flag parsing error already happened
  return { ...ctx, exitCode: ParserExitCodes.UNKNOWN_ERROR };
}
