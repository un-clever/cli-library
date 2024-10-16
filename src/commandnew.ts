// reimplementing command as a structural (not functional) interface

import type {
  Command,
  LeafCommand,
  LeafContext,
  MultiCommand,
  ParsedArgs,
  RawArgs,
  RunContext,
} from "./commandnewtypes.ts";
import { ParserExitCodes, ParsingError } from "./errors.ts";
import { hose } from "./hoses.ts";
import { helpAsUnknown } from "./tests/spikes/helpCommand.ts";
import type { StandardOutputs } from "./types.ts";

/**
 * run is the way to run any command, whether multi or simple
 *
 * TODO: clarify the protocol. What does a short-circuited pipe mean,
 * that we should just return with the status code? What does an exception mean?
 * And, how can I maximize clarity and DX after being away for awhile.
 * Pipelines can read a little opaquely.
 * @param root
 * @param args
 * @param std
 * @returns
 */
export async function run(root: Command, args: RawArgs, std: StandardOutputs) {
  // deno-fmt-ignore
  const initialCtx = { done: false, exitCode: 0, std, root, path: [], args, argPos: 0 };
  const ctx = await findLeafOrHelp(initialCtx);

  // Couldn't  I just
  // const ctx2 = hose<LeafContext<unknown>>([ // TODO Hose isn't un-clever
  //   // findCommand,
  //   // checkHelp,
  //   parseFlags,
  //   enrichFlags,
  //   validateFlags,
  //   runLeaf,
  // ], haltIf)(ctx);

  // maybe split the leaf stuff off into a flag parsing and handler running context
  if (ctx.leaf) {
    const finalContext = await runLeafOrHelp(
      { ...ctx, command: ctx.leaf, flagsP: {} } as LeafContext<unknown>,
    );
    return finalContext.exitCode;
  } else {
    return ctx.exitCode;
  }
}

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
      `the arguments '${
        ctx.args.slice(ctx.argPos)
      } didn't provide a valid value for`,
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

function handleShortFlags<VV>(
  _flagstring: string,
  _ctx: LeafContext<VV>,
): LeafContext<VV> {
  throw new Error("short flags aren't implemented yet");
}

function parseFlags<VV>(ctx: LeafContext<VV>): LeafContext<VV> {
  let c = { ...ctx };
  const args: ParsedArgs = []; //parsed args
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
