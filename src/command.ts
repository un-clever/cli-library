import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type {
  Command,
  CommandFn,
  CommandMap,
  Flagset,
  PrintFn,
  Writer,
} from "./types.ts";

const defaultLogger: PrintFn = makeLogger(Deno.stdout);

/**
 * Turn a handler and flags into a simple (leaf) command
 */
export function command<VV>(
  name: string,
  description: string,
  flags: Flagset<VV>,
  handler: CommandFn<VV>,
): Command {
  const describe = () => `${name}: ${description}`;
  const help = (): string =>
    `${name}: ${description}\n\n${getFlagsetHelp(flags)}`;
  const run = async (
    rawargs: string[],
    log: PrintFn = defaultLogger,
  ): Promise<number> => {
    try {
      const parse = getFlagsetParser(flags);
      const params = parse(rawargs);
      const result = await handler(params.flags, log, params.args);
      return result;
    } catch (err) {
      await log(help());
      await log("\n" + GetHelp(err));
      return 999;
    }
  };

  // CHANGING because multi commands have to parse some, then parse some more, then run
  return { describe, help, run };
}

export function makeLogger(output: Writer): PrintFn {
  const encoder = new TextEncoder();
  // handle the rest later
  // maybe function or entries or k:fn
  return (msg: string, ..._rest: unknown[]) =>
    output.write(encoder.encode(msg));
}

export function multiCommand(
  name: string,
  description: string,
  commands: CommandMap,
): Command {
  const describe = () => `${name}: ${description}`;
  const help = () => [describe, ...Object.keys(commands)].join("\n");
  const run = async (
    rawargs: string[],
    log: PrintFn = defaultLogger,
  ): Promise<number> => {
    try {
      const subcmd = rawargs[0];
      if (subcmd && subcmd in commands) {
        // TODO push subcmd into command path
        // maybe run should be runSub(["path1"], args, log)
        const cmd = commands[subcmd];
        return await cmd.run(rawargs.slice(1), log);
      }
      await log(`unrecognized subcommand: '${subcmd}`);
      await log(help());
      return 1000;
    } catch (err) {
      await log(help());
      await log("\n" + GetHelp(err));
      return 999;
    }
  };
  return { describe, help, run };
}
