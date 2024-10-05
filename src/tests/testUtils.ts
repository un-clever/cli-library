import { booleanFlag, numberFlag, stringFlag } from "../flags.ts";
import { intFlag } from "../extras/intFlag.ts";
import type {
  CliArgs,
  FlagsetParser,
  OptionalFlag,
  RequiredFlag,
} from "../types.ts";
import { assertEquals, assertThrows, it } from "testlib";

export interface ArgsExample {
  raw: string[];
  parsed: Error | Omit<CliArgs<unknown>, "flags">;
}

export interface FlagsetExample<VV> {
  raw: string[];
  parsed: Error | CliArgs<VV>;
}

export function testmanyArgExamples(
  parse: FlagsetParser<unknown>,
  examples: ArgsExample[],
) {
  for (const eg of examples) {
    const testTitle = `"${eg.raw.join(" ")}"`;
    if (eg.parsed instanceof Error) {
      it(`rejects args ${testTitle}`, () => {
        assertThrows(() => parse(eg.raw));
      });
    } else {
      it(`parses args ${testTitle}`, () => {
        const { args, dashdash } = parse(eg.raw);
        assertEquals({ args, dashdash }, eg.parsed);
      });
    }
  }
}

export function testmanyFlagsetExamples<VV>(
  flagtype: string,
  parse: FlagsetParser<VV>,
  examples: FlagsetExample<VV>[],
) {
  for (const eg of examples) {
    const testTitle = `Flag type "${flagtype}": "${eg.raw.join(" ")}"`;
    if (eg.parsed instanceof Error) {
      it(`rejects args ${testTitle}`, () => {
        assertThrows(() => parse(eg.raw));
      });
    } else {
      it(`parses args ${testTitle}`, () => {
        const { args, flags, dashdash } = parse(eg.raw);
        assertEquals({ args, flags, dashdash }, eg.parsed);
      });
    }
  }
}

export function getTestFlagset() {
  const one: OptionalFlag<string> = {
    name: "one",
    description: "your optional string argument",
    required: false,
    parser: stringFlag,
  };

  const dos: RequiredFlag<string> = {
    name: "dos",
    description: "your required string",
    required: true,
    parser: stringFlag,
  };

  const three: OptionalFlag<boolean> = {
    name: "three",
    description: "your optional boolean flag (booleans must be optional)",
    required: false,
    parser: booleanFlag,
  };

  const four: OptionalFlag<number> = {
    name: "four",
    description: "your optional float flag",
    required: false,
    parser: numberFlag,
  };

  const cinco: RequiredFlag<number> = {
    name: "cinco",
    description: "your required int flag",
    required: true,
    parser: intFlag,
  };

  // an untyped flagset
  return { one, dos, three, four, cinco };
}
export type TtestFlagsetReturn = {
  one?: string;
  dos: string;
  three?: boolean;
  four?: number;
  cinco: number;
};
