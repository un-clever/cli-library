import { GetHelp, ParsingError } from "./errors.ts";
import { Command } from "./index.ts";
import type { CliArgs, CommandFn, Flagset } from "./types.ts";
import type { Writer } from "@std/io";

export class FlagsParser<VV> {
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
      // NOTE: we used to make dashdash optional, but now we just parse it and fail if not allowed
      if (arg === "--") {
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

export function command<VV>(
  opts: {
    description: string;
    flags: Flagset<VV>;
    run: CommandFn<VV>;
    output: Writer;
  },
): Command<VV> {
  const encoder = new TextEncoder();
  const write = async (msg: string) =>
    await opts.output.write(encoder.encode(msg));
  const parse = (args: string[]) => {
    const fp = new FlagsParser(opts.flags);
    return fp.parse(args);
  };
  // const parseAndRun = async (args: string[]): Promise<number> => {
  //   try {
  //     const params = parse(args);
  //     const result = await opts.run(params, write);
  //     return result;
  //   } catch (err) {
  //     await write(GetHelp(err));
  //     return 999;
  //   }
  // };

  return {
    describe: () => opts.description,
    help: () => opts.description,
    parse,
    execute: opts.run,
  };
}
