import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type {
  Command,
  CommandFn,
  Flagset,
  StandardOutputs,
  StringOutput,
  Writer,
} from "./types.ts";

export function command<VV>(
  opts: {
    description: string;
    flags: Flagset<VV>;
    run: CommandFn<VV>;
  },
): Command<VV> {
  const help = (): string =>
    `${opts.description}\n\n${getFlagsetHelp(opts.flags)}`;
  return {
    describe: () => opts.description,
    help,
    parse: getFlagsetParser(opts.flags),
    execute: opts.run,
  };
}

export function makeStringOutput(output: Writer): StringOutput {
  const encoder = new TextEncoder();
  return (msg: string) => output.write(encoder.encode(msg));
}

export async function runCommand<VV>(
  // TODO: add name here or in command object, which may become names path in multicommand
  cmd: Command<VV>,
  args: string[],
  std: StandardOutputs,
): Promise<number> {
  try {
    const params = cmd.parse(args);
    const result = await cmd.execute(params, std);
    return result;
  } catch (err) {
    await std.err(cmd.help());
    await std.err("\n" + GetHelp(err));
    return 999;
  }
}
