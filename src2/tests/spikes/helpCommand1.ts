import { ParserExitCodes } from "../../errors.ts";
import { booleanFlag, required } from "../../flags.ts";
import type { Flagset, StandardOutputs } from "../../types.ts";
import type {
  Args,
  LeafCommand,
  LeafHandler,
  MultiCommand,
  Status,
} from "./types1.ts";

export interface HelpCommandFlags {
  deep: boolean;
}
const helpFlags: Flagset<HelpCommandFlags> = {
  deep: required("deep", "show help deeply into subcommands", booleanFlag),
};

export const helpHandler: LeafHandler<HelpCommandFlags> = async (
  flags: HelpCommandFlags,
  _args: Args,
  std: StandardOutputs,
  _path: string[],
  _command: LeafCommand<HelpCommandFlags>,
  _root?: MultiCommand,
): Status => {
  // note that normal handling should show help for the help command with help --help
  if (flags.deep) throw new Error("Deep not handled yet.");
  await std.outs(JSON.stringify({ commands: "TBD" }));
  return ParserExitCodes.NO_ERROR;
};

export const helpCommand: LeafCommand<HelpCommandFlags> = {
  name: "help",
  description: "show help for a multicommand",
  instructions: "",
  flagset: helpFlags,
  argset: [],
  handler: helpHandler,
};
export const helpAsUnknown = helpCommand as unknown as LeafCommand<unknown>;
