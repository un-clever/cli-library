import { assertThrows, describe, it } from "testlib";
import { getFlagsetHelp, getFlagsetParser } from "../flagset.ts";
import {
  booleanFlagset,
  booleanFlagsetCases,
  dashDashCases,
  defaultingNumericFlagset,
  defaultingNumericFlagsetCases,
  defaultingStringFlagset,
  defaultingStringFlagsetCases,
  optionalNumericFlagset,
  optionalNumericFlagsetCases,
  optionalStringFlagset,
  optionalStringFlagsetCases,
  requiredNumericFlagset,
  requiredNumericFlagsetCases,
  requiredStringFlagset,
  requiredStringFlagsetCases,
  simpleArgsCases,
} from "./testData.ts";
import { testmanyArgExamples, testmanyFlagsetExamples } from "./testUtils.ts";
import { assertEquals } from "@std/assert/equals";

describe("we can parse simple positional arguments", () => {
  testmanyArgExamples(getFlagsetParser<unknown>({}), simpleArgsCases);
});
describe("we can parse positional args with a --", () => {
  testmanyArgExamples(getFlagsetParser<unknown>({}), dashDashCases);
});
describe("we can disallow -- in the args", () => {
  const parse = getFlagsetParser<unknown>({}, false);
  it("can always prohibit dashdash in the args", () => {
    for (const c of dashDashCases) {
      assertThrows(() => parse(c.raw));
    }
  });
});
describe("we can parse boolean (default-false) flags", () => {
  testmanyFlagsetExamples(
    "booleanFlag",
    getFlagsetParser(booleanFlagset),
    booleanFlagsetCases,
  );
});
describe("we can parse required string flags", () => {
  testmanyFlagsetExamples(
    "required string flag",
    getFlagsetParser(requiredStringFlagset),
    requiredStringFlagsetCases,
  );
});
describe("we can parse defaulting string flags", () => {
  testmanyFlagsetExamples(
    "optional string flag with default",
    getFlagsetParser(defaultingStringFlagset),
    defaultingStringFlagsetCases,
  );
});
describe("we can parse optional string flags", () => {
  testmanyFlagsetExamples(
    "optional string flag without default",
    getFlagsetParser(optionalStringFlagset),
    optionalStringFlagsetCases,
  );
});

describe(" we can parse required numeric flags", () => {
  testmanyFlagsetExamples(
    "required numeric flag without default",
    getFlagsetParser(requiredNumericFlagset),
    requiredNumericFlagsetCases,
  );
});
describe(" we can parse defaulting numeric flags", () => {
  testmanyFlagsetExamples(
    "required string flag with default",
    getFlagsetParser(defaultingNumericFlagset),
    defaultingNumericFlagsetCases,
  );
});
describe("we can parse optional numeric flags", () => {
  testmanyFlagsetExamples(
    "optional numeric flag without default",
    getFlagsetParser(optionalNumericFlagset),
    optionalNumericFlagsetCases,
  );
});

describe("flagsets can generate help", () => {
  it("rudimentasry flagset help", () => {
    const help = getFlagsetHelp(optionalStringFlagset);
    assertEquals(help, "--help: show comand help\n--title: \n");
  });
});
