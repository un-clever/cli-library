import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type { Command, CommandFn, Flagset, Logger, Writer } from "./types.ts";

const defaultLogger: Logger = makeLogger(Deno.stdout);

/**
 * Turn a handler and flags into a simple (leaf) command
 */
export function command<VV>(
  name: string,
  description: string,
  flags: Flagset<VV>,
  handler: CommandFn<VV>,
): Command<VV> {
  const describe = () => `${name}: ${description}`;
  const help = (): string =>
    `${name}: ${description}\n\n${getFlagsetHelp(flags)}`;
  const run = async (
    rawargs: string[],
    log: Logger = defaultLogger,
  ): Promise<number> => {
    try {
      const parse = getFlagsetParser(flags);
      const params = parse(rawargs);
      const result = await handler(params, log);
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

export function makeLogger(output: Writer): Logger {
  const encoder = new TextEncoder();
  // handle the rest later
  // maybe function or entries or k:fn
  return (msg: string, ..._rest: unknown[]) =>
    output.write(encoder.encode(msg));
}

export function multiCommand() {}
// //
// export async function runCommand<VV>(
//   // TODO: add name here or in command object, which may become names path in multicommand
//   cmd: Command<VV>,
//   args: string[],
//   output: Writer,
// ): Promise<number> {
//   const write = makeLogger(output);

//   try {
//     const params = cmd.parse(args);
//     const result = await cmd.handler(params, write);
//     return result;
//   } catch (err) {
//     await write(cmd.help());
//     await write("\n" + GetHelp(err));
//     return 999;
//   }
// }
