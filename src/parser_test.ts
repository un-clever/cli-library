// deno-lint-ignore-file no-unused-vars
import { assertEquals, describe, it } from "testlib";
import { parseArgs, type ParseOptions } from "@std/cli";

// const problemParseOptions = {
//   string: ["command", "depth"],
//   boolean: ["show"],
//   // alias: { show: "s" },
// };

const problemParseArgs = ["-s"];

interface ParseTest {
  opts: ParseOptions;
  args: string[];
  // deno-lint-ignore no-explicit-any
  expected: Record<string, any>;
}

const parseTestsTable: ParseTest[] = [
  {
    opts: {
      string: ["command", "depth"],
      boolean: ["show"],
    },
    args: ["-s"],
    expected: { _: [], show: false, s: true },
  },
  {
    opts: {
      string: ["command"],
      boolean: ["show"],
      alias: { show: "s" },
    },
    args: ["-s", "--depth", "4"],
    expected: { _: [], s: true, show: true, depth: 4 },
  },
  {
    opts: {
      string: ["command", "depth"],
      boolean: ["show"],
      alias: { show: "s" },
    },
    args: ["-s", "--depth", "4"],
    expected: { _: [], s: true, show: true, depth: "4" },
  },
];

describe("Deno's cli parser, cli.parseArgs", () => {
  it("explores an exception I keep seeing", () => {
    for (const { opts, args, expected } of parseTestsTable) {
      const parsed = parseArgs(args, opts);
      assertEquals(parsed, expected);
    }
  });
});
