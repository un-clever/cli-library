// code for using flagsets to parse command lines and generate help
import { ParsingError } from "./errors.ts";
import type { CliArgs, Flagset, FlagsetParser } from "./types.ts";

export function getFlagsetParser<VV>(
  flagset: Flagset<VV>,
  allowDashdash = true,
): FlagsetParser<VV> {
  const fp = new FlagsParser1(flagset, allowDashdash);
  return fp.parse.bind(fp);
}

export function auditFlagset<VV>(fs: Flagset<VV>): string[] {
  const problems: string[] = [];
  for (const k in fs) {
    const flag = fs[k];
    if (k !== flag.name) {
      problems.push(`flag key ("${k}") !== flag.name ("${flag.name}")`);
    }
    if (k === "help") {
      problems.push(`help is processed especially; don't a help flag`);
    }
  }
  return problems;
}

// don't use this outside the module--it may get refactored into a more functional approach
class FlagsParser1<VV> {
  // mutable: we will be mutating these during the parse, so this class is NOT thread safe
  protected partialFlags: Partial<VV> = {};
  protected args: string[] = [];
  protected dashdash: string[] = [];

  constructor(private flagset: Flagset<VV>, readonly allowDashdash = true) {}

  parse(args: string[]): CliArgs<VV> {
    // re-init mutable props
    this.partialFlags = {};
    this.args = [];
    this.dashdash = [];
    // we will be incrementing i in the loop body
    for (let i = 0; i < args.length;) {
      const arg = args[i++];
      if (["--help", "-h"].includes(arg)) {
        throw new ParsingError("help requested", "", "help");
      } else if (arg === "--") {
        // NOTE: we used to make dashdash optional, but now we just parse it and fail if not allowed
        i = this.gulpDashDash(i, args);
      } else if (arg.startsWith("--")) {
        i = this.handleFlag(arg.slice(2), i, args);
      } else {
        this.args.push(arg);
      }
    }
    if (!this.allowDashdash && this.dashdash) {
      throw new ParsingError(
        '"--" not allowed',
        "this command doesn't allow passthrough args after a '--'",
        "--",
      );
    }
    return {
      flags: this.confirmedFlags(this.partialFlags),
      args: this.args,
      dashdash: this.dashdash,
    };
  }

  gulpDashDash(start: number, args: string[]): number {
    if (start < args.length) {
      this.dashdash = args.slice(start);
      return args.length; // end the loop
    }
    throw new ParsingError(
      "no args found after '--'",
      "", // The special flag '--' passes all the following args to another program. If there are none, oming the '--'.",
      "--",
    );
  }

  handleFlag(flagnameOrDie: string, start: number, args: string[]): number {
    if (flagnameOrDie in this.flagset) {
      const flagname = flagnameOrDie as keyof VV;
      const flag = this.flagset[flagname];
      const { n, value } = flag.parser.parse(start, args);
      if (value !== undefined) {
        this.partialFlags[flagname] = value;
        return start + n;
      }
      throw new ParsingError(
        "missing arg",
        `the arguments '${
          args.slice(start)
        } didn't provide a valid argument for the flag`,
        flagnameOrDie,
      );
    }
    throw new ParsingError("unrecognized flag", "", flagnameOrDie);
  }

  confirmedFlags(flags: Partial<VV>): VV {
    for (const k in this.flagset) {
      const flag = this.flagset[k];

      // handle required and default values
      if (!this.partialFlags[k]) {
        // NOTE: parser defaults always take precedence because flag logic
        // depends on them
        if (flag.parser.default !== undefined) {
          this.partialFlags[k] = flag.parser.default;
        } else if (flag.default !== undefined) {
          this.partialFlags[k] = flag.default;
        } else if (flag.required) {
          throw new ParsingError("missing required flag", "", k);
        }
      }
      const value = this.partialFlags[k];
      if (!flag.parser.validate || flag.parser.validate(value)) continue;
      throw new ParsingError(
        "invalid value",
        `the value '${value}' didn't parse a valid type for this flag`,
        k,
      );
    }
    return flags as VV;
  }
}

export function flagNames<VV>(fs: Flagset<VV>): (keyof Flagset<VV>)[] {
  const names = [...Object.keys(fs), "help"];
  return names.sort() as (keyof Flagset<VV>)[];
}

export function getFlagsetHelp<VV>(fs: Flagset<VV>): string {
  const result: string[] = [];
  for (const name of flagNames(fs)) {
    if (name === "help") {
      result.push(`--help: show comand help`);
      continue;
    }
    const f = fs[name];
    // TODO: somewhere, f.name === name
    result.push(
      `--${f.name}: ${f.description}${
        f.default ? ` (default: ${f.default})` : ""
      }`,
    );
  }
  result.push("");
  return result.join("\n");
}
