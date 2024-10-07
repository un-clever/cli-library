import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type {
  Command,
  CommandFn,
  CommandMap,
  Flagset,
  StandardOutputs,
} from "./types.ts";

export function command<VV>(
  name: string,
  description: string,
  flagset: Flagset<VV>,
  handler: CommandFn<VV>,
): Command {
  const describe = () => `${name}: ${description}`;
  const help = (path?: string[]): string =>
    `${path ? path.join(" ") + " " : ""}${describe()}\n\n${
      getFlagsetHelp(flagset)
    }`;
  function helpDeep(path: string[]) {
    return { path: [...path, name], children: flagset };
  }
  async function run(
    rawArguments: string[],
    std: StandardOutputs,
  ): Promise<number> {
    const errorLine = (msg: string) => std.errs(msg + "\n"); // "error + line"
    try {
      const parse = getFlagsetParser<VV>(flagset, true);
      const { flags, args } = parse(rawArguments);
      return await handler(
        flags,
        args,
        std,
      );
    } catch (err) {
      errorLine(GetHelp(err));
      errorLine("run with --help flag for more info");
      return 1001;
    }
  }
  return {
    describe,
    help,
    helpDeep,
    run,
  };
}

export function multiCommand(
  name: string,
  description: string,
  commands: CommandMap,
): Command {
  const describe = () => `${name}: ${description}`;
  const help = () => [describe(), ...Object.keys(commands)].join("\n");
  function helpDeep(path: string[]) {
    return { path: [...path, name], children: commands };
  }

  async function run(
    rawArguments: string[],
    std: StandardOutputs, // allow for deep running
  ): Promise<number> {
    const errorLine = (msg: string) => std.errs(msg + "\n"); // "error + line"
    try {
      const subcmd = rawArguments[0];
      if (subcmd && subcmd in commands) {
        const cmd = commands[subcmd];
        return await cmd.run(rawArguments.slice(1), std);
      }
      await errorLine(`unrecognized subcommand: '${subcmd}`);
      await errorLine(help());
      return 1002;
    } catch (err) {
      await errorLine(help());
      await errorLine(GetHelp(err));
      return 1001;
    }
  }
  return { describe, help, helpDeep, run };
}
