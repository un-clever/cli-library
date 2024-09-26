// a broken command parser attempt

import { ParsingError } from "../errors.ts";
import type { CliArgs, Flag, Flagset } from "../types.ts";

interface parseState<F> {
  result: Omit<CliArgs<F>, "flags"> & { flags: Partial<F> };
  tail: string[];
}
function initParse<F>(tail: string[]): parseState<F> {
  return { result: { args: [], flags: {}, dashdash: [] }, tail };
}
class FlagFinder {
  readonly flagsByDashedNames: Record<string, Flag<unknown>>;
  constructor(private flagset: Flagset) {
    this.flagsByDashedNames = this.populateDashedNames(flagset);
  }

  isDashdash = (arg: string) => arg === "--";
  isFlag = (arg: string) => arg.startsWith("-"); // how do I skip positional params that are quoted but start with -?
  getFlag(arg: string) {
    const flag = this.flagsByDashedNames[arg];
    if (flag) return flag;
    throw new ParsingError(`unrecognized flag "${arg}"`, "", arg);
  }

  private populateDashedNames(flagset: Flagset): Record<string, Flag<unknown>> {
    const result: Record<string, Flag<unknown>> = {};
    for (const k in flagset) {
      const flag = flagset[k];
      result["--" + k] = flag;
      // TODO: handle aliases
      // TODO: handle shortcuts
      // TODO: handle concatenated shortcuts
    }
    return result;
  }
}

export function cliParser<F>(flagset: Flagset, args: string[]): CliArgs<F> {
  let { result, tail } = initParse<F>(args);
  const flagf = new FlagFinder(flagset);
  while (tail.length > 0) {
    const arg = tail.shift() as string;
    if (flagf.isDashdash(arg)) {
      result.dashdash = tail;
      tail = [];
    } else if (flagf.isFlag(arg)) {
      const flag = flagf.getFlag(arg);
      const { value, tail: newTail } = flag.parser(tail);
      if (value === undefined) {
        throw new ParsingError(
          `failed to parse argument for flag ${arg}`,
          `Check the arguments you provided for flag ${arg}: "${
            JSON.stringify(tail)
          }" didn't start with a recognized value of that type.`,
          arg,
        );
      }
      tail = newTail;
      // result.flags[flag.name] = value; // TODO: strongly type this!
    } else {
      result.args.push(arg);
    }
    // TODO: validate args
    // TODO: validate and type flags
  }
  return result as CliArgs<F>;
}
