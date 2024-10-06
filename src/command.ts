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
    stdout?: Writer,
    stderr?: Writer,
  ): Promise<number> => {
    const logger = makeAsyncLoggerFancy(stdout, stderr);
    try {
      const parse = getFlagsetParser(flags);
      const params = parse(rawargs);
      const result = await handler(params.flags, params.args, logger);
      return result;
    } catch (err) {
      await logger.ewrite(help());
      await logger.ewrite("\n" + GetHelp(err));
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

export function makeAsyncLoggerFancy(
  standardOutput = Deno.stdout as Writer,
  errorOutput = Deno.stderr as Writer,
) {
  const encoder = new TextEncoder();

  function makeOutput(w: Writer, suffix = "") {
    // TODO: this doesn't check the return value (number of bytes written)
    return (msg: string) => w.write(encoder.encode(msg + suffix));
  }

  // Maybe: make log and error handle extra args like console does maybe sync too?
  // log(...data: any[]): void
  // error(...data: any[]): void

  // these are all async functions!
  return {
    log: makeOutput(standardOutput, "\n"),
    error: makeOutput(errorOutput, "\n"),
    write: makeOutput(standardOutput),
    ewrite: makeOutput(errorOutput),
  };
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
    stdout?: Writer,
    stderr?: Writer,
  ): Promise<number> => {
    const logger = makeAsyncLoggerFancy(stdout, stderr);
    try {
      const subcmd = rawargs[0];
      if (subcmd && subcmd in commands) {
        // TODO push subcmd into command path
        // maybe run should be runSub(["path1"], args, log)
        const cmd = commands[subcmd];
        return await cmd.run(rawargs.slice(1), stdout, stderr);
      }
      await logger.error(`unrecognized subcommand: '${subcmd}`);
      await logger.error(help());
      return 1000;
    } catch (err) {
      await logger.error(help());
      await logger.error("\n" + GetHelp(err));
      return 999;
    }
  };
  return { describe, help, run };
}
