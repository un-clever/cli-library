import { GetHelp } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type { Command, CommandFn, Flagset } from "./types.ts";
import type { Writer } from "@std/io";

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

export async function runCommand<VV>(
  cmd: Command<VV>,
  args: string[],
  output: Writer,
): Promise<number> {
  const encoder = new TextEncoder();
  const write = async (msg: string) => await output.write(encoder.encode(msg));

  try {
    const params = cmd.parse(args);
    const result = await cmd.execute(params, write);
    return result;
  } catch (err) {
    await write(GetHelp(err));
    return 999;
  }
}