// deno-lint-ignore-file no-unused-vars
import { command, multiCommand } from "../command.ts";
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
import { captureRun } from "../extras/outputHelpersDeno.ts";

const testFlagset = getTestFlagset();
const { one, dos, three } = testFlagset;

// define a simple command: commandOne
const nameOne = "command1";
const descOne = "test command";
type FlagsTypeOne = { one?: string };
const flagsOne = { one };
async function handleOne(
  flags: FlagsTypeOne,
  args: string[],
  std: StandardOutputs,
): Promise<number> {
  await std.outs(JSON.stringify({ flags, args }));
  return 0;
}
const commandOne = command(nameOne, descOne, flagsOne, handleOne);
const helpOne =
  "command1: test command\n\n--help: show comand help\n--one: your optional string argument\n";

describe("we can make a simple command", () => {
  it("the types check out", () => {
    assertType<Has<CommandFn<FlagsTypeOne>, typeof handleOne>>(true);
    assertType<IsExact<Flagset<FlagsTypeOne>, typeof flagsOne>>(true);
  });

  it("seems to work", async () => {
    const args = ["a", "b", "--one", "c"];
    const expectedParams: ParsedArgs<FlagsTypeOne> = {
      flags: { one: "c" },
      args: ["a", "b"],
    };
    assertEquals(commandOne.describe(), `${nameOne}: ${descOne}`);
    assertEquals(
      commandOne.help(),
      `${nameOne}: ${descOne}\n\n--help: show comand help\n--one: your optional string argument\n`,
    );
    const { status, output } = await captureRun(commandOne, args);
    assertEquals(JSON.parse(output), expectedParams);
    assertEquals(status, 0);
  });
  it("shows help correctly", async () => {
    const { status, output, errOutput } = await captureRun(commandOne, [
      "--help",
    ]);
    assertEquals(output, helpOne);
    assertEquals(errOutput, "");
    assertEquals(status, 0);
  });
});

// define a simple command: commandTwo
const nameTwo = "command2";
const descTwo = "another test command";
type FlagsTypeTwo = { dos: string; three?: boolean };
const flagsTwo: Flagset<FlagsTypeTwo> = { dos, three };
async function handleTwo(
  flags: FlagsTypeTwo,
  args: string[],
  std: StandardOutputs,
): Promise<number> {
  await std.outs(JSON.stringify({ flags, args }));
  return 0;
}
const commandTwo = command(nameOne, descOne, flagsOne, handleOne);

// We can join them into a multicommand
const multiOne = multiCommand("multi1", "a command with subcommands", {
  one: commandOne,
  two: commandTwo,
});

describe("we can make a multicommand", () => {
  it("has top-level help", () => {
    assertEquals(
      multiOne.help(),
      "multi1: a command with subcommands\none\ntwo",
    );
  });

  it("shows that help on the commandline", async () => {
    const { status, output, errOutput } = await captureRun(
      multiOne,
      ["--help"],
    );
    assertEquals(status, 0);
    assertEquals(output, "multi1: a command with subcommands\none\ntwo");
    assertEquals(errOutput, "");
  });

  it("shows subcommand 1 help", async () => {
    const { status, output, errOutput } = await captureRun(
      multiOne,
      ["one", "--help"],
    );
    // assertEquals(output, "");
    assertEquals(
      output,
      helpOne,
    );
    assertEquals(status, 0);
  });

  it.skip("shows subcommand 2 help", () => {});
  it("shows subcommand 1 output", async () => {
    const { status, output, errOutput } = await captureRun(
      multiOne,
      ["one", "a", "b", "--one", "c"],
    );
    assertEquals(JSON.parse(output), { flags: { one: "c" }, args: ["a", "b"] });
    assertEquals(errOutput, "");
    assertEquals(status, 0);
  });
  it.skip("shows subcommand 2 output", () => {});
});
