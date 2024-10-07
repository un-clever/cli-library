import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type { Command, CommandFn, Flagset, StandardOutputs } from "./types.ts";

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
    try {
      const parse = getFlagsetParser<VV>(flagset, true);
      const cliargs = parse(rawArguments);
      return await handler(cliargs.flags, cliargs.args, std);
    } catch (err) {
      std.errs(GetHelp(err));
      std.errs("run with --help flag for more info");
      return 1001;
    }
  }
  return {
    help,
    describe,
    run,
    // parse: getFlagsetParser(opts.flags),
    // execute: opts.run,
  };
}

// export async function runCommand<VV>(
//   // TODO: add name here or in command object, which may become names path in multicommand
//   cmd: Command<VV>,
//   args: string[],
//   std: StandardOutputs,
// ): Promise<number> {
//   try {
//     const params = cmd.parse(args);
//     const result = await cmd.execute(params, std);
//     return result;
//   } catch (err) {
//     await std.errs(cmd.help());
//     await std.errs("\n" + GetHelp(err));
//     return 999;
//   }
// }
