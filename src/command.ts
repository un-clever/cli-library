import { GetHelp, ParserExitCodes, ParsingError } from "./errors.ts";
import { getFlagsetHelp, getFlagsetParser } from "./flagset.ts";
import type {
  Command,
  CommandFn,
  CommandMap,
  Flagset,
  HelpFn,
  StandardOutputs,
} from "./types.ts";

async function handleCommandException(
  err: Error,
  std: StandardOutputs,
  help: HelpFn,
): Promise<number> {
  if (err instanceof ParsingError) {
    if (err.code === ParserExitCodes.HELP_AND_EXIT) {
      await std.outs(help());
      return ParserExitCodes.NO_ERROR;
    }
    if (err.code === ParserExitCodes.JUST_EXIT) {
      return ParserExitCodes.NO_ERROR;
    }
    await std.errs(help());
    return err.code;
  }
  await std.errs(GetHelp(err));
  return ParserExitCodes.UNKNOWN_ERROR;
}

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
    try {
      const parse = getFlagsetParser<VV>(flagset, true);
      const { flags, args } = parse(rawArguments);
      return await handler(
        flags,
        args,
        std,
      );
    } catch (err) {
      return handleCommandException(err, std, help);
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
    try {
      const subcmd = rawArguments[0];
      if (subcmd === "--help") {
        throw new ParsingError(
          "help request",
          ParserExitCodes.HELP_AND_EXIT,
          "",
          "",
        );
      }
      if (subcmd && subcmd in commands) {
        const cmd = commands[subcmd];
        return await cmd.run(rawArguments.slice(1), std);
      }
      throw new ParsingError(
        "unrecognized subcommand",
        ParserExitCodes.UNRECOGNIZED_SUBCOMMAND,
        "",
        subcmd,
      );
    } catch (err) {
      return handleCommandException(err, std, help);
    }
  }
  return { describe, help, helpDeep, run };
}
