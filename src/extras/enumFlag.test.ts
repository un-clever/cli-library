// deno-lint-ignore-file no-unused-vars
import { assertEquals, assertType, describe, IsExact, it } from "testlib";
import { FlagtypeDef } from "../types.ts";
import { makeEnumFlag, StringsToEnums } from "./enumFlag.ts";

type flagTestCase<T> = [
  FlagtypeDef<T>, // flagdef to be tested
  string[], // input args
  T | undefined, // expected parse result
  number, // number of args consumed
];

describe("the enumFlag allows a string arg from a set of legal values", () => {
  const legalValues = ["one", "two", "three", "four"];
  type TlegalValues = "one" | "two" | "three" | "four";
  type _extractedT = StringsToEnums<typeof legalValues>;

  // TODO: fix this typing true
  assertType<IsExact<StringsToEnums<typeof legalValues>, TlegalValues>>(true);

  // const oneToFourFlag: FlagtypeDef<TlegalValues> = makeEnumFlag(legalValues);
  it("parses our examples", () => {
  });
});
