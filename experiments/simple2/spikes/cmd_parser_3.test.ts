// deno-lint-ignore-file no-unused-vars
import {
  command,
  type CommandFunction,
  type StringWriter,
} from "./cmd_parser_3.ts";
import { getTestFlagset, type TtestFlagsetReturn } from "../tests/testUtils.ts";
import type { CliArgs, Flagset } from "../types.ts";
import { assertEquals, assertType, describe, type IsExact, it } from "testlib";
import { Buffer } from "@std/io";

const testFlagset = getTestFlagset();
const { one, dos, three, four, cinco } = testFlagset;

describe("we can make a simple command", () => {
  type CommandType = { one?: string };
  // const simpleFlags: Flagset<CommandType> = { one };
  const flags = { one };
  type Params = CliArgs<CommandType>;

  async function run(params: Params, write: StringWriter): Promise<number> {
    await write(JSON.stringify(params));
    return 0;
  }

  it("the types check out", () => {
    assertType<IsExact<CommandFunction<CommandType>, typeof run>>(true);
    assertType<IsExact<Flagset<CommandType>, typeof flags>>(true);
  });

  it("tries", async () => {
    const args = ["a", "b", "--one", "c"];
    const expectedParams: Params = {
      flags: { one: "c" },
      args: ["a", "b"],
      dashdash: [],
    };
    const description = "test command";
    const output = new Buffer(); // one way to trap command output...
    const cmd = command({ description, flags, run, output });
    assertEquals(cmd.describe(), description);
    assertEquals(cmd.help(), description);
    assertEquals(cmd.parse(args), expectedParams);
    await cmd.parseAndRun(args);
    const decoder = new TextDecoder(); //...and here's grabbing that output
    assertEquals(JSON.parse(decoder.decode(output.bytes())), expectedParams);
  });
});

import { dashDashCases, simpleArgsCases } from "../tests/testData.ts";
import { testmanyArgExamples } from "../tests/testUtils.ts";
import { FlagsParser } from "./cmd_parser_3.ts";
import { assertThrows } from "@std/assert/throws";

describe("we can parse simple positional arguments", () => {
  const parser = new FlagsParser<unknown>({});
  const parse = (args: string[]) => parser.parse(args);
  testmanyArgExamples(parse, simpleArgsCases);
});

describe("we can parse positional args with a --", () => {
  const parser = new FlagsParser<unknown>({});
  const parse = (args: string[]) => parser.parse(args);
  testmanyArgExamples(parse, dashDashCases);
});

describe("we can disallow -- in the args", () => {
  const parser = new FlagsParser<unknown>({}, false);
  const parse = (args: string[]) => parser.parse(args);
  for (const c of dashDashCases) {
    it("can always prohibit dashdash in the args", () => {
      assertThrows(() => parse(c.raw));
    });
  }
});

describe.skip("TODO: it can parse boolean (default-false) flags");
describe.skip("TODO: it can parse string flags");
describe.skip("TODO: it can parse numeric flags");
