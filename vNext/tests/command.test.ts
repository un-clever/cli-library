// deno-lint-ignore-file no-unused-vars
import { command, runCommand } from "../command.ts";
import { getTestFlagset } from "./testUtils.ts";
import type {
  CliArgs,
  CommandFn,
  Flagset,
  FlagsetParseFn,
  StringWrite,
} from "../types.ts";
import { assertEquals, assertType, describe, type IsExact, it } from "testlib";
import { Buffer } from "@std/io";

const testFlagset = getTestFlagset();
const { one } = testFlagset;

describe("we can make a simple command", () => {
  type CommandType = { one?: string };
  const flags = { one };
  type Params = CliArgs<CommandType>;

  async function run(params: Params, write: StringWrite): Promise<number> {
    await write(JSON.stringify(params));
    return 0;
  }

  it("the types check out", () => {
    assertType<IsExact<CommandFn<CommandType>, typeof run>>(true);
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
    const cmd = command({ description, flags, run });
    assertEquals(cmd.describe(), description);
    assertEquals(
      cmd.help(),
      `test command\n\n--one: your optional string argument\n`,
    );
    assertEquals(cmd.parse(args), expectedParams);
    const status = await runCommand(cmd, args, output);
    assertEquals(status, 0);
    const decoder = new TextDecoder(); //...and here's grabbing that output
    assertEquals(JSON.parse(decoder.decode(output.bytes())), expectedParams);
  });
});
