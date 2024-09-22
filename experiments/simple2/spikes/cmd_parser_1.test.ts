// deno-lint-ignore-file no-unused-vars no-explicit-any
/**
 * An experiment in trying to get a simple parser to work
 * starting just with positional args, then trying to add
 * typed flag parsing
 */
import { assertEquals, describe, it } from "testlib";
import {
  booleanFlag,
  dateFlag,
  floatFlag,
  intFlag,
  negatedFlag,
  stringFlag,
} from "../flagParsers.ts";
import type { CliArgs, FlagParser, OptionalFlag } from "../types.ts";
import { FlagsetParsed } from "../types.ts";
import { KeyOfPropertyEntries } from "@sinclair/typebox";
import { ParsingError } from "../commands.ts";

/**
 * A flagset with just positional args
 */
const flagsetJPs = {};

// deno-fmt-ignore  (to keep the table concise)
const flagsetJPcases = [
  // no dashdash
  {desc: "no args", input: [], args: [], dashdash: []},
  {desc: "one arg", input: ["a"], args: ["a"], dashdash: []},
  {desc: "two args", input: ["a", "b"], args: ["a", "b"], dashdash: []},
  {desc: "three args", input: ["a", "b", "c"], args: ["a", "b", "c"], dashdash: []},
  {desc: "four args", input: ["a", "b", "c", "d"], args: ["a", "b", "c", "d"], dashdash: []},
  // with a dashdash
  {desc: "initial dashdash", input: ["--","a", "b",  "c", "d"], args: [] , dashdash: ["a", "b","c", "d"]},
  {desc: "middle dashdash", input: ["a", "b", "--", "c", "d"], args: ["a", "b"] , dashdash: ["c", "d"]},
  {desc: "terminal dashdash", input: ["a", "b", "c", "d", "--"], args: ["a", "b", "c", "d"] , dashdash: []},
];

function parse(flagset: any, rawargs: string[]): CliArgs<{ one?: string }> {
  // initialie
  let tail = rawargs.slice(0);
  const flags = {};
  const args: string[] = [];
  let dashdash: string[] = [];

  // main parse loop
  while (tail.length > 0) {
    // console.debug(tail, tail.length, args, args.length);
    const arg1 = tail.shift() as string;
    // console.debug(tail, arg1, args);
    if (arg1 === "--") {
      dashdash = tail;
      tail = [];
    } else if (arg1.startsWith("-")) args.push("flag");
    else args.push(arg1);
    // console.debug(tail, tail.length, args, args.length);
  }

  // clean and return
  return { flags, args, dashdash };
}

/**
 * A flagset with simple flags args
 */
const assist: OptionalFlag<boolean> = {
  name: "assist",
  description: "an optional boolean flag",
  parser: booleanFlag,
  required: false,
};

const flagset1Flag = { assist };

// deno-fmt-ignore  (to keep the table concise)
const flagset1Fcases = [
  ...flagsetJPcases.map(c => ({...c, assist: false})),
  // with a flag
  {desc: "no args, one flag", input: ["--assist"], args: [], dashdash: [], assist: true },
  {desc: "one arg, one flag", input: ["a", "--assist"], args: ["a"], dashdash: [], assist: true},
  {desc: "one flag, one arg", input: [ "--assist","a"], args: ["a"], dashdash: [], assist: true},
  {desc: "middle dashdash 1 flag, 2 args", input: ["a", "--assist", "b", "--", "c", "d"], args: ["a", "b"] , dashdash: ["c", "d"], assist: true},
  {desc: "middle dashdash consuming flag for subcommand, 2 args", input: ["a","b", "--", "c", "--assist", "d"], args: ["a", "b"] , dashdash: ["c", "--assist", "d"], assist: false},

];

function getParser(k: string) {
  if (k === "assist") return flagset1Flag.assist;
  throw new ParsingError("unrecognized flag", "", k);
}

function parseWithFlags(
  flagset: typeof flagset1Flag, // cheating on types
  rawargs: string[],
): CliArgs<{ assist?: boolean }> {
  // initialie
  let tail = rawargs.slice(0);
  const flags: Record<string, any> = {};
  const args: string[] = [];
  let dashdash: string[] = [];

  // main parse loop
  while (tail.length > 0) {
    // console.debug(tail, tail.length, args, args.length);
    const arg1 = tail.shift() as string;
    // console.debug(tail, arg1, args);
    if (arg1 === "--") {
      dashdash = tail;
      tail = [];
    } else if (arg1.startsWith("--")) {
      const k = arg1.slice(2);
      const prsr = getParser(k);
      const { tail: newTail, value } = prsr.parser(tail);
      flags[k] = value;
      tail = newTail;
    } else args.push(arg1);
    // console.debug(tail, tail.length, args, args.length);
  }

  // clean and return
  return { flags, args, dashdash };
}

describe("command line parsings", () => {
  for (const { desc, input, args, dashdash } of flagsetJPcases) {
    it(`a flagless parser handles: ${desc}`, () => {
      const result = parse(flagsetJPs, input);
      assertEquals(result.args, args);
      assertEquals(result.dashdash, dashdash);
    });
  }
  for (const { desc, input, args, dashdash, assist } of flagset1Fcases) {
    it(`a one-flag parser handles: ${desc}`, () => {
      const result = parseWithFlags(flagset1Flag, input);
      assertEquals(result.args, args);
      assertEquals(result.dashdash, dashdash);
      assertEquals(!!result.flags.assist, assist);
    });
  }
});
