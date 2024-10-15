// reimplementing command with hoses

import { hose } from "./hoses.ts";
import { Flagset, StandardOutputs } from "./types.ts";

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

const findLeafOrHelp = hose<RunContext>([], haltIf);

const runLeafOrHelp = hose([], haltIf);

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
