// deno-lint-ignore-file no-unused-vars
import { command } from "../command.ts";
import { getTestFlagset } from "./testUtils.ts";
import type {
  CommandFn,
  Flagset,
  FlagsetParseFn,
  ParsedArgs,
  StandardOutputs,
} from "../types.ts";
import {
  assertEquals,
  assertType,
  describe,
  Has,
  type IsExact,
  it,
} from "testlib";
import { Buffer } from "@std/io";
import { standardizeOutputs } from "../output.ts";

const testFlagset = getTestFlagset();
const { one } = testFlagset;

describe("we can make a simple command", () => {
  type CommandType = { one?: string };
  const flags = { one };

  async function run(
    flags: CommandType,
    args: string[],
    std: StandardOutputs,
  ): Promise<number> {
    await std.outs(JSON.stringify({ flags, args }));
    return 0;
  }

  it("the types check out", () => {
    assertType<Has<CommandFn<CommandType>, typeof run>>(true);
    assertType<IsExact<Flagset<CommandType>, typeof flags>>(true);
  });

  it("seems to work", async () => {
    const args = ["a", "b", "--one", "c"];
    const expectedParams: ParsedArgs<CommandType> = {
      flags: { one: "c" },
      args: ["a", "b"],
    };
    const description = "test command";
    const output = new Buffer(); // one way to trap command output...
    const cmd = command(description, flags, run);
    assertEquals(cmd.describe(), description);
    assertEquals(
      cmd.help(),
      `test command\n\n--help: show comand help\n--one: your optional string argument\n`,
    );
    const status = await cmd.run(
      args,
      standardizeOutputs(output, output),
    );
    assertEquals(status, 0);
    const decoder = new TextDecoder(); //...and here's grabbing that output
    assertEquals(JSON.parse(decoder.decode(output.bytes())), expectedParams);
  });
});
