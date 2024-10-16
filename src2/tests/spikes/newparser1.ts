import { toNamespacedPath } from "jsr:@std/path/to-namespaced-path";
import type {
  Args,
  Command,
  LeafCommand,
  MultiCommand,
  Status,
  SubcommandPath,
  TraverseFn,
} from "./types1.ts";
import { ParserExitCodes, ParsingError } from "../../errors.ts";
import type { Flagset, StandardOutputs } from "../../types.ts";
import { getFlagsetHelp } from "../../flagset.ts";
import { helpAsUnknown } from "./helpCommand1.ts";

function isHelpFlag(a: string) {
  return ["-h", "--help"].includes(a);
}

function isHelpCommand(a: string) {
  return isHelpFlag(a) || a === "help";
}

export function isMultiCommand(cmd: Command): cmd is MultiCommand {
  return "subcommands" in cmd;
}

export function isLeafCommand(cmd: Command): cmd is LeafCommand<unknown> {
  return "flagset" in cmd;
}

/**
 * getLeaf traverses down a multicommand's tree until it finds a leaf command, a request for help, or an error
 * @param root
 * @param raw
 * @returns
 */
export function getLeaf(
  acommand: Command,
  raw: Args,
): { leaf: LeafCommand<unknown>; leafPath: SubcommandPath; leafArgs: Args } {
  const leafPath: SubcommandPath = [];
  const leafArgs = raw;
  // if we've got a simple command, no need (or way) to travers down
  if (isLeafCommand(acommand)) return { leaf: acommand, leafPath, leafArgs };
  const root: MultiCommand = acommand;
  let cur = root.subcommands;
  while (true) {
    const arg = leafArgs.shift(); // ADVANCE THE LOOP
    if (arg === undefined) break; // HALT THE LOOP
    if (isHelpCommand(arg)) return { leaf: helpAsUnknown, leafPath, leafArgs };
    if (arg in cur) {
      const nextCmd = cur[arg];
      if (isLeafCommand(nextCmd)) return { leaf: nextCmd, leafPath, leafArgs };
      // DESCEND the command path
      cur = nextCmd.subcommands;
      leafPath.push(arg);
    } else {throw new ParsingError(
        "unrecognized subcommand",
        ParserExitCodes.UNRECOGNIZED_SUBCOMMAND,
        "",
        arg,
      );}
  }
  // ran out of args before we found a leaf
  throw new ParsingError(
    "missing subcommand",
    ParserExitCodes.MISSING_SUBCOMMAND,
    "provide more subcommands",
    leafPath.join(" "),
  );
}

function handleLongFlag<VV>(
  flagset: Flagset<VV>,
  flagname: string,
  start: number,
  args: Args,
): { values: Partial<VV>; start: number } {
  // TODO: handle if flagname is really flag=value
  if (flagname in flagset) {
    const prop = flagname as keyof VV;
    const flag = flagset[prop];
    const { n, value } = flag.parser.parse(start, args);
    if (value !== undefined) {
      const values: Partial<VV> = {};
      values[prop] = value;
      return { start: start + n, values };
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

function parseFlags<VV>(
  flagset: Flagset<VV>,
  args: Args,
): { parsedFlags: Partial<VV>; parsedArgs: Args } {
  // CAUTION check for isHelpFlag(args[0]) before this
  let parsedFlags: Partial<VV> = {};
  const parsedArgs: Args = [];

  for (let i = 0; i < args.length;) {
    const arg = args[i++];
    if (arg.startsWith("--")) {
      parsedFlags = {
        ...parsedFlags,
        ...handleLongFlag(flagset, arg.slice(2), i, args),
      };
    } else if (arg.startsWith("-")) {
      throw new Error("TBD, short flags aren't handled yet");
    } else {
      parsedArgs.push(arg);
    }
  }

  return { parsedFlags, parsedArgs };
}

function useLeaf(leaf: LeafCommand<unknown>, leafArgs: Args) {
  return { leaf, leafArgs, leafPath: [] };
}

function getLeafHelp(cmd: LeafCommand<unknown>, path: SubcommandPath) {
  return `${[...path, cmd.name].join(" ")}: ${cmd.description}}
${cmd.instructions}\n\n${getFlagsetHelp(cmd.flagset)}
`;
}

export async function runCommand(
  root: Command,
  raw: Args,
  std: StandardOutputs,
  // extraSources: EnrichFn[] = [],
): Status {
  try {
    const { leaf, leafArgs, leafPath } = isMultiCommand(root)
      ? getLeaf(root, raw)
      : useLeaf(root, raw);
    if (isHelpFlag(leafArgs[0])) {
      await std.outs(getLeafHelp(leaf, leafPath));
      return ParserExitCodes.NO_ERROR;
    } else {
      const { parsedArgs, parsedFlags } = parseFlags(leaf.flagset, leafArgs);
      // Enrich(parsedFlags)
      // Validate(enrichedFlags, parsedArgs)
      // run(flags, args)
      // return await runLeaf(
      //   leaf,
      //   path,
      //   remaining,
      //   std,
      //   extraSources,
      //   isMulticommand(cmd) ? cmd : undefined,
      // );
      return 0;
    }
  } catch (err) {
    console.error(err.message);
    return ParserExitCodes.UNKNOWN_ERROR;
  }
}

// export const traverse: TraverseFn = (command: Command, raw: Args) => {
//   let current = command;
//   const path: string[] = []; // command path so far
//   const remaining: Args = [...raw]; // remaining raw args
//   let help = false;
//   let leaf = helpCommand;
//   while (true) {
//     if (isLeafCommand(current)) leaf = current; // still need to check for help
//     const arg1 = remaining.shift();
//     // simplest case: we have a leaf command with no more arguments and exit
//     if (arg1 === undefined) break;
//     // help flag: precludes other args
//     if (isHelpFlag(arg1)) return { path, remaining: [], help: true, leaf };
//     // help command runs helpCommand as the command if it's a multicommand
//     // but on a leaf command, that help is just a positional arg
//     // NOT SURE I LIKE THIS
//     // ONLY THE BOTTOM LEVEL NEEDS A BIG DOC COMMAND
//     // and what does --help in a multicommand path (not a leaf yet) mean?
//     if (arg1 === "help" && isMultiCommand(current)) help = true;
//     if (isLeafCommand(current) || help) break;
//     // [help, current] = [true, leaf];  // can oneline changes like this
//     current = current[arg1] || throw new Error(command not found)
//     path.push(arg1);
//   }
//   return { path, remaining, help, leaf };
// };
