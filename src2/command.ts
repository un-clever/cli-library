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
