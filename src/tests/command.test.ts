// deno-lint-ignore-file no-unused-vars
import { command, makeLogger } from "../command.ts";
import { getTestFlagset } from "./testUtils.ts";
import type {
  CliArgs,
  CommandFn,
  Flagset,
  FlagsetParser,
  PrintFn,
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

const testFlagset = getTestFlagset();
const { one } = testFlagset;

describe("we can make a simple command", () => {
  type CommandType = { one?: string };
  const flags = { one };
  type Params = CliArgs<CommandType>;

  async function handler1(
    write: PrintFn,
    flags: CommandType,
    args: string[],
  ): Promise<number> {
    await write(JSON.stringify({ flags, args, dashdash: [] }));
    return 0;
  }

  it("the types check out", () => {
    assertType<Has<CommandFn<CommandType>, typeof handler1>>(true);
    assertType<IsExact<Flagset<CommandType>, typeof flags>>(true);
  });

  it("seems to work", async () => {
    const args = ["a", "b", "--one", "c"];
    const expectedParams: Params = {
      flags: { one: "c" },
      args: ["a", "b"],
      dashdash: [],
    };
    const description = "test command";
    const output = new Buffer(); // one way to trap command output...
    const cmd = command("simple", description, flags, handler1);
    assertEquals(cmd.describe(), "simple: " + description);
    assertEquals(
      cmd.help(),
      `simple: test command\n\n--help: show comand help\n--one: your optional string argument\n`,
    );
    const status = await cmd.run(args, makeLogger(output));
    assertEquals(status, 0);
    const decoder = new TextDecoder(); //...and here's grabbing that output
    assertEquals(JSON.parse(decoder.decode(output.bytes())), expectedParams);
  });
});
