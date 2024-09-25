import { booleanFlag, floatFlag, stringFlag } from "../flags.ts";
import { intFlag } from "../extras/intFlag.ts";
import type { CliArgs, OptionalFlag, RequiredFlag } from "../types.ts";

export interface ArgsExample {
  raw: string[];
  parsed: Error | Omit<CliArgs<unknown>, "flags">;
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
    parser: floatFlag,
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
