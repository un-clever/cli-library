import { toNamespacedPath } from "jsr:@std/path/to-namespaced-path";
import type {
  Args,
  Command,
  LeafCommand,
  LeafHandler,
  MultiCommand,
  TraverseFn,
} from "./types.ts";

export const helpCommand = {} as LeafCommand<unknown>;

function isHelpFlag(a: string) {
  return ["-h", "--help"].includes(a);
}

export function isMultiCommand(cmd: Command): cmd is MultiCommand {
  return "subcommands" in cmd;
}

export function isLeafCommand(cmd: Command): cmd is LeafCommand<unknown> {
  return "flagset" in cmd;
}

export const traverse: TraverseFn = (command: Command, raw: Args) => {
  let current = command;
  const path: string[] = []; // command path so far
  const remaining: Args = [...raw]; // remaining raw args
  let help = false;
  let leaf = helpCommand;
  while (true) {
    if (isLeafCommand(current)) leaf = current; // still need to check for help
    const arg1 = remaining.shift();
    // simplest case: we have a leaf command with no more arguments and exit
    if (arg1 === undefined) break;
    // help flag: precludes other args
    if (isHelpFlag(arg1)) return { path, remaining: [], help: true, leaf };
    // help command runs helpCommand as the command if it's a multicommand
    // but on a leaf command, that help is just a positional arg
    // NOT SURE I LIKE THIS
    // ONLY THE BOTTOM LEVEL NEEDS A BIG DOC COMMAND
    // and what does --help in a multicommand path (not a leaf yet) mean?
    if (arg1 === "help" && isMultiCommand(current)) help = true;
    if (isLeafCommand(current) || help) break;
    // [help, current] = [true, leaf];  // can oneline changes like this
    current = current[arg1] || throw new Error(command not found)
    path.push(arg1);
  }
  return { path, remaining, help, leaf };
};
