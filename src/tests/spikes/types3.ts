// pipeline look at cli

import type { StandardOutputs } from "../../types.ts";
import type {
  Args,
  Command,
  LeafCommand,
  MultiCommand,
  Status,
  SubcommandPath,
} from "./types1.ts";

interface MMTSContext {
  std: StandardOutputs;
  spec: Command;
}

interface MMTSOutput {
  commandPath: SubcommandPath;
  args: Args;
  argPos: number;
  command: LeafCommand<unknown>;
}

export function maybeMultiToSinglePipeline(
  _ctx: MMTSContext,
  _args: string[],
): MMTSOutput {
  // descend gathering commandPath
  // until: error, help, or leaf
  return {} as MMTSOutput;
}

interface runLeafCtx<VV> {
  command: LeafCommand<VV>;
  root?: MultiCommand;
  commandPath: SubcommandPath;
  remainingArgs: Args;
  argPos: number;
  flagsP: Partial<VV>;
  flags?: VV;
}

export function runLeafPipeline<VV>(): Status {
  // if help exitHelp()
  // parse flags
  // enrich flags
  // validate flags (running pre-run on flags)
  // validate positional args (maybe run pre-run on flags, args)
  // run the command
  // handle errors
  return Promise.resolve(0);
}
