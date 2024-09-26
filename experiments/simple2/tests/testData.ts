// Data useful for testing CLI implementations
import { booleanFlag, required, stringFlag } from "../flags.ts";
import { CliArgs, Flagset } from "../types.ts";
import type { ArgsExample, FlagsetExample } from "./testUtils.ts";

export const GenericParsingError = new Error("missing args after --");

// deno-fmt-ignore  (to keep the table concise)
export const simpleArgsCases: ArgsExample[] = [
  {raw: [], parsed: {args:[], dashdash:[]}},
  {raw: ["a"], parsed: {args:["a"], dashdash:[]}},
  {raw: ["a","b"], parsed: {args:["a","b"], dashdash:[]}},
  {raw: ["a","b","c"], parsed: {args:["a","b","c"], dashdash:[]}},
  {raw: ["a","b","c","d"], parsed: {args:["a","b","c","d"], dashdash:[]}},
  {raw: ["a","b","c","d","e"], parsed: {args:["a","b","c","d","e"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f"], parsed: {args:["a","b","c","d","e","f"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g"], parsed: {args:["a","b","c","d","e","f","g"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h"], parsed: {args:["a","b","c","d","e","f","g","h"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h","i"], parsed: {args:["a","b","c","d","e","f","g","h","i"], dashdash:[]}},
  {raw: ["a","b","c","d","e","f","g","h","i","j"], parsed: {args:["a","b","c","d","e","f","g","h","i","j"], dashdash:[]}},
];

export function makeDashDashCase(
  insertBefore: number,
  eg: ArgsExample,
): ArgsExample {
  if (insertBefore >= eg.raw.length) { // dashdash at end causes error
    const raw = [...eg.raw, "--"];
    return { raw, parsed: GenericParsingError };
  }
  const args = eg.raw.slice(0, insertBefore);
  const dashdash = eg.raw.slice(insertBefore);
  const raw = [...args, "--", ...dashdash];
  return ({ raw, parsed: { args, dashdash } });
}

export function makeDashDashCases(insertBefore: number) {
  return (eg: ArgsExample) => makeDashDashCase(insertBefore, eg);
}

export const dashDashCases: ArgsExample[] = [
  ...simpleArgsCases.map(makeDashDashCases(0)),
  ...simpleArgsCases.map(makeDashDashCases(1)),
  ...simpleArgsCases.map(makeDashDashCases(2)),
  ...simpleArgsCases.map(makeDashDashCases(5)),
  ...simpleArgsCases.map(makeDashDashCases(9)),
  ...simpleArgsCases.map(makeDashDashCases(11)),
];

const emptyParse: CliArgs<unknown> = { args: [], flags: {}, dashdash: [] };

function fuzzedExample<VV>(eg: FlagsetExample<VV>): FlagsetExample<VV>[] {
  const { raw, parsed } = eg;
  if (parsed instanceof Error) return [eg];
  const { args, flags, dashdash } = parsed;
  if (dashdash.length > 0) {
    throw new Error("TEST CODING ERROR: fuzzer can't handle dashdash'ed tests");
  }
  // deno-fmt-ignore  (to keep the table concise)
  return [
    eg, // original
    // inject a positional arg before
    {raw: ["early", ...raw], parsed: {args:["early", ...args] ,flags, dashdash}},
    // inject a positional arg after
    {raw: [...raw, "late"], parsed: {args:[...args, "late"] ,flags, dashdash}},
    // inject positionals before and after
    // FIXME: {raw: ["early", ...raw, "late"], parsed: {args:["early", ...args, "late"] ,flags, dashdash}},
    // add an unrecognized flag before and after
    {raw: ["--some-unrecognized-flag", ...raw], parsed: GenericParsingError},
    // FIXME: {raw: [...raw, "--some-unrecognized-flag"], parsed: GenericParsingError},
    // add some passthrough arguments
    // FIXME {raw: [...raw, "--", "a", "b", "c"], parsed: {args:["early", ...args] ,flags, dashdash: ["a", "b", "c"]}},
    // add a -- without following arguments
    // FIXME: {raw: [...raw, "--"], parsed: GenericParsingError},
  ];
}

// Boolean flag test data
export type booleanFlagsetType = { verbose: boolean };
export const booleanFlagset: Flagset<booleanFlagsetType> = {
  verbose: required("verbose", "", booleanFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const booleanFlagsetCases: FlagsetExample<booleanFlagsetType>[] = [
  ...fuzzedExample<booleanFlagsetType>({ raw: ["--verbose"], parsed: { ...emptyParse, flags: { verbose: true }}}),

  // missing flags should default to false since there's no way to set them false yet
  { raw: [], parsed: { ...emptyParse, flags: { verbose: false } } },
];

// String flag test data
export type requiredStringFlagsetType = { title: string };
export const requiredStringFlagset: Flagset<requiredStringFlagsetType> = {
  title: required("title", "", stringFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const requiredStringFlagsetCases: FlagsetExample<requiredStringFlagsetType>[] = [
  // TODO: functionalize this for numbers too
  { raw: ["--title", "go-for-it"], parsed: { ...emptyParse, flags: {title: "go-for-it" } } },
  { raw: ["--title", "Go For Words"], parsed: { ...emptyParse, flags: {title: "Go For Words" } } },
  { raw: ["early", "--title", "go-for-it"], parsed: { args: ["early"], flags: {title: "go-for-it" }, dashdash: []}},
  // FIX COMMENTED TESTS
  // { raw: ["--title", "go-for-it", "late"], parsed: { args: ["late"], flags: {title: "go-for-it" }, dashdash: [] }},
  // { raw: ["early", "--title", "go-for-it", "late"], parsed: { args: ["early", "late"], flags: {title: "go-for-it" }, dashdash: [] }},

  // PASSTHROUGH ARGS HANDLING
  // { raw: ["--title", "pass through args after", "--", "a"], parsed: { args: [], flags: {title: "pass through args after"}, dashdash: ["a"]}},
  // { raw: ["early", "--title", "pass through args after", "--", "a"], parsed: { args: ["early"], flags: {title: "pass through args after"}, dashdash: ["a"]}},
  // { raw: ["early", "--title", "pass through args after", "late", "--", "a"], parsed: { args: ["early", "late"], flags: {title: "pass through args after"}, dashdash: ["a"]}},
  // { raw: ["--title", "arg", "late" "--"], parsed: GenericParsingError }, // missing dashdash args
  // NOTE: "--" as a string flag arg is JUST a string, not the pass-through flag
  { raw: ["--title", "--"], parsed: { ...emptyParse, flags: {title: "--" }}},

  // EXPECTED ERRORS
  { raw: [], parsed: GenericParsingError }, // missing flag
  { raw: ["--title"], parsed: GenericParsingError }, // missing arg
  { raw: ["--ttile", "arg"], parsed: GenericParsingError }, // unrecognized flag
];
