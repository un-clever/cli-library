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
  description: string,
  flagset: Flagset<VV>,
  handler: CommandFn<VV>,
): Command {
  const describe = () => description;
  const help = (): string => `${description}\n\n${getFlagsetHelp(flagset)}`;
  async function run(
    rawArguments: string[],
    std: StandardOutputs,
  ): Promise<number> {
    const errln = (msg: string) => std.errs(msg + "\n"); // "error + line"
    try {
      const parse = getFlagsetParser<VV>(flagset, true);
      const { flags, args } = parse(rawArguments);
      return await handler(flags, args, std);
    } catch (err) {
      errln(GetHelp(err));
      errln("run with --help flag for more info");
      return 1001;
    }
  }
  return {
    help,
    describe,
    run,
  };
}

export function multiCommand(
  name: string,
  description: string,
  commands: CommandMap,
): Command {
  const describe = () => `${name}: ${description}`;
  const help = () => [describe, ...Object.keys(commands)].join("\n");
  async function run(
    rawArguments: string[],
    std: StandardOutputs,
  ): Promise<number> {
    const errln = (msg: string) => std.errs(msg + "\n"); // "error + line"
    try {
      const subcmd = rawArguments[0];
      if (subcmd && subcmd in commands) {
        // TODO push subcmd into command path
        // maybe run should be runSub(["path1"], args, log)
        const cmd = commands[subcmd];
        return await cmd.run(rawArguments.slice(1), std);
      }
      await errln(`unrecognized subcommand: '${subcmd}`);
      await errln(help());
      return 1002;
    } catch (err) {
      await errln(help());
      await errln(GetHelp(err));
      return 1001;
    }
  }
  return { describe, help, run };
}
