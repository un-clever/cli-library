import { ParsingError } from "../commands.ts";
import { GetHelp } from "../commands.ts";
import type { CliArgs, Flagset } from "../types.ts";
import type { Writer } from "@std/io";

export type StringWriter = (msg: string) => Promise<number>; // writer interface

export type CommandFunction<VV> = (
  params: CliArgs<VV>,
  write: StringWriter,
) => Promise<number>;

export class FlagsParser<VV> {
  // mutable: we will be mutating these during the parse, so this class is not thread safe
  protected partialFlags: Partial<VV> = {};
  protected args: string[] = [];
  protected dashdash: string[] = [];

  constructor(private flagset: Flagset<VV>, private handleDashDash = true) {}

  parse(args: string[]): CliArgs<VV> {
    // re-init mutable props
    this.partialFlags = {};
    this.args = [];
    this.dashdash = [];
    // we will be incrementing i in the loop body
    for (let i = 0; i < args.length;) {
      const arg = args[i++];
      if (this.handleDashDash && arg === "--") {
        i += this.gulpDashDash(i, args);
      } else if (arg.startsWith("--")) {
        i += this.handleFlag(arg.slice(2), i, args);
      } else {
        this.args.push(arg);
      }
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
        if (flag.required) {
          throw new ParsingError("missing required flag", "", k);
        }
        this.partialFlags[k] = flag.parser.default || flag.default;
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
    run: CommandFunction<VV>;
    output: Writer;
  },
) {
  const encoder = new TextEncoder();
  const write = async (msg: string) =>
    await opts.output.write(encoder.encode(msg));
  const parse = (args: string[]) => {
    const fp = new FlagsParser(opts.flags);
    return fp.parse(args);
  };
  const parseAndRun = async (args: string[]): Promise<number> => {
    try {
      const params = parse(args);
      const result = await opts.run(params, write);
      return result;
    } catch (err) {
      await write(GetHelp(err));
      return 999;
    }
  };

  return {
    describe: () => opts.description,
    help: () => opts.description,
    parse,
    run: opts.run,
    parseAndRun,
    write,
  };
}
