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
      const { flags, args } = parse(rawArguments);
      return await handler(flags, args, std);
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
  };
}
