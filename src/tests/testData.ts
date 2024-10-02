// Data useful for testing CLI implementations
import { numberFlag } from "../flags.ts";
import { booleanFlag, optional, required, stringFlag } from "../flags.ts";
import type { CliArgs, Flagset } from "../types.ts";
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

export function fuzzedExample<VV>(
  eg: FlagsetExample<VV>,
): FlagsetExample<VV>[] {
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
    {raw: ["early", ...raw, "late"], parsed: {args:["early", ...args, "late"] ,flags, dashdash}},
    // add an unrecognized flag before and after
    {raw: ["--some-unrecognized-flag", ...raw], parsed: GenericParsingError},
    {raw: [...raw, "--some-unrecognized-flag"], parsed: GenericParsingError},
    // add some passthrough arguments
    {raw: [...raw, "--", "a", "b", "c"], parsed: {args, flags, dashdash: ["a", "b", "c"]}},
    // add some passthrough arguments AND positionals
    {raw: ["early", "early", ...raw, "late", "later", "z", "--", "a", "b", "c"], parsed: {args:["early", "early", ...args, "late", "later", "z"] , flags, dashdash: ["a", "b", "c"]}},
    // add a -- without following arguments
    {raw: [...raw, "--"], parsed: GenericParsingError},
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

// Required String flag test data
export type requiredStringFlagsetType = { title: string };
export const requiredStringFlagset: Flagset<requiredStringFlagsetType> = {
  title: required("title", "", stringFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const requiredStringFlagsetCases: FlagsetExample<requiredStringFlagsetType>[] = [
  // TODO: functionalize this for numbers too
  ...fuzzedExample({ raw: ["--title", "go-for-it"], parsed: { ...emptyParse, flags: {title: "go-for-it" } } }),
  ...fuzzedExample({ raw: ["--title", "Go For Words"], parsed: { ...emptyParse, flags: {title: "Go For Words" } } }),
  // NOTE: "--" as a string flag arg is JUST a string, not the pass-through flag
  { raw: ["--title", "--"], parsed: { ...emptyParse, flags: {title: "--" }}},
  // EXPECTED ERRORS
  { raw: [], parsed: GenericParsingError }, // missing flag
  { raw: ["--title"], parsed: GenericParsingError }, // missing arg
  { raw: ["--ttile", "arg"], parsed: GenericParsingError }, // unrecognized flag
];

// Defaulting String flag test data
export type defaultingStringFlagsetType = { title?: string };
export const defaultingStringFlagset: Flagset<defaultingStringFlagsetType> = {
  title: optional("title", "", stringFlag, "going to the movies"),
};
// deno-fmt-ignore  (to keep the table concise)
export const defaultingStringFlagsetCases: FlagsetExample<defaultingStringFlagsetType>[] = [
  ...fuzzedExample({ raw: [], parsed: { ...emptyParse, flags: {title: "going to the movies" } } }),
  ...fuzzedExample({ raw: ["--title", "go-for-it"], parsed: { ...emptyParse, flags: {title: "go-for-it" } } }),
  ...fuzzedExample({ raw: ["--title", "Go For Words"], parsed: { ...emptyParse, flags: {title: "Go For Words" } } }),
  // NOTE: "--" as a string flag arg is JUST a string, not the pass-through flag
  { raw: ["--title", "--"], parsed: { ...emptyParse, flags: {title: "--" }}},
  // EXPECTED ERRORS
  { raw: ["--title"], parsed: GenericParsingError }, // missing arg
  { raw: ["--ttile", "arg"], parsed: GenericParsingError }, // unrecognized flag
];

// Optional String flag test data
export type optionalStringFlagsetType = { title?: string };
export const optionalStringFlagset: Flagset<optionalStringFlagsetType> = {
  title: optional("title", "", stringFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const optionalStringFlagsetCases: FlagsetExample<optionalStringFlagsetType>[] = [
  ...fuzzedExample({ raw: [], parsed: { ...emptyParse, flags: {} } }),
  ...fuzzedExample({ raw: ["--title", "go-for-it"], parsed: { ...emptyParse, flags: {title: "go-for-it" } } }),
  ...fuzzedExample({ raw: ["--title", "Go For Words"], parsed: { ...emptyParse, flags: {title: "Go For Words" } } }),
  // NOTE: "--" as a string flag arg is JUST a string, not the pass-through flag
  { raw: ["--title", "--"], parsed: { ...emptyParse, flags: {title: "--" }}},
  // EXPECTED ERRORS
  { raw: ["--title"], parsed: GenericParsingError }, // missing arg
  { raw: ["--ttile", "arg"], parsed: GenericParsingError }, // unrecognized flag
];

// required numeric flag test data
export type requiredNumericFlagsetType = { count: number };
export const requiredNumericFlagset: Flagset<requiredNumericFlagsetType> = {
  count: required("count", "", numberFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const requiredNumericFlagsetCases: FlagsetExample<requiredNumericFlagsetType>[] = [
  ...fuzzedExample({raw: ["--count", "5.4"], parsed: {args:[], flags:{count: 5.4}, dashdash: []}}),
  ...fuzzedExample({raw: ["--count", "-2000.345"], parsed: {args:[], flags:{count: -2000.345}, dashdash: []}}),
  ...fuzzedExample({raw: ["--count", "-2"], parsed: {args:[], flags:{count: -2}, dashdash: []}}),
  // NOTE: we'll grab numbers off the front of any string, just like parseFloat, use a validator if you want more
  ...fuzzedExample({raw: ["--count", "12abcd"], parsed: {args:[], flags:{count: 12}, dashdash: []}}),
  // EXPECTED ERRORS
  { raw: ["--count"], parsed: GenericParsingError }, // missing arg
  { raw: ["--cnt", "5"], parsed: GenericParsingError }, // unrecognized flag
  // ...Invalid args
  {raw: ["--count", "abf1"], parsed: GenericParsingError},
  {raw: ["--count", "elephant"], parsed: GenericParsingError},
  // ...NOTE: unlike string flags, "--" is not a valid argument
  {raw: ["--count", "--"], parsed: GenericParsingError},
];

// defaulting required numeric flag test data
export type defaultingNumericFlagsetType = { count: number };
export const defaultingNumericFlagset: Flagset<defaultingNumericFlagsetType> = {
  count: required("count", "", numberFlag, -99.5),
};
// deno-fmt-ignore  (to keep the table concise)
export const defaultingNumericFlagsetCases: FlagsetExample<defaultingNumericFlagsetType>[] = [
  ...fuzzedExample({raw: ["--count", "31.55"], parsed: {args:[], flags:{count: 31.55}, dashdash: []}}),
  ...fuzzedExample({raw: [], parsed: {args:[], flags:{count: -99.5}, dashdash: []}}),
  // EXPECTED ERRORS
  { raw: ["--cnt", "5"], parsed: GenericParsingError }, // unrecognized flag
  {raw: ["--count"], parsed: GenericParsingError}, // flag present, arg missing
  // ...Invalid args
  {raw: ["--count", "abf1"], parsed: GenericParsingError},
  {raw: ["--count", "elephant"], parsed: GenericParsingError},
  {raw: ["--count", "--"], parsed: GenericParsingError},
];

// optional numeric flag test data
export type optionalNumericFlagsetType = { count?: number };
export const optionalNumericFlagset: Flagset<optionalNumericFlagsetType> = {
  count: optional("count", "", numberFlag),
};
// deno-fmt-ignore  (to keep the table concise)
export const optionalNumericFlagsetCases: FlagsetExample<optionalNumericFlagsetType>[] = [
  ...fuzzedExample({raw: [], parsed: {args:[], flags:{}, dashdash: []}}),
  ...fuzzedExample({raw: ["--count", "5.4"], parsed: {args:[], flags:{count: 5.4}, dashdash: []}}),
  ...fuzzedExample({raw: ["--count", "12abcd"], parsed: {args:[], flags:{count: 12}, dashdash: []}}),
  // EXPECTED ERRORS
  { raw: ["--count"], parsed: GenericParsingError }, // missing arg
  { raw: ["--cnt", "5"], parsed: GenericParsingError }, // unrecognized flag
  // ...Invalid args
  {raw: ["--count", "abf1"], parsed: GenericParsingError},
  {raw: ["--count", "elephant"], parsed: GenericParsingError},
  {raw: ["--count", "--"], parsed: GenericParsingError},
];
