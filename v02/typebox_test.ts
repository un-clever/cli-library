// deno-lint-ignore-file no-unused-vars
import { assert, assertEquals, describe, it } from "testlib";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { initializeTypebox } from "./typebox.ts";

const typeNeedingConversions = Type.Object({
  string1: Type.Optional(Type.String()),
  number1: Type.Optional(Type.Number()),
  boolean1: Type.Optional(Type.Boolean()),
  integer1: Type.Optional(Type.Integer()),
  // Type.Date produces JS compatible types, but not JSON schema compatible
  date1: Type.Optional(Type.Date()),
  dateString: Type.Optional(Type.String({ format: "date" })),
});

interface TestCase {
  name: string;
  input: any;
  expected: any;
}
const numbersTests: TestCase[] = [
  {
    name: "===== FLOATING POINT NUMBERS: number -> number",
    input: { number1: 4.0 },
    expected: { number1: 4 },
  },
  {
    name: "number -> number (with decimals)",
    input: { number1: 4.2 },
    expected: { number1: 4.2 },
  },
  {
    name: "string -> number",
    input: { number1: "4" },
    expected: { number1: 4 },
  },
  {
    name: "string -> number (with decimals)",
    input: { number1: "4.2" },
    expected: { number1: 4.2 },
  },
];

const integersTests: TestCase[] = [
  {
    name: "===== INTEGERS: number -> integer",
    input: { integer1: 4 },
    expected: { integer1: 4 },
  },
  {
    name: "number -> integer (truncated)",
    input: { integer1: 5 - 0.001 },
    expected: { integer1: 4 },
  },
  {
    name: "string -> integer",
    input: { integer1: "4" },
    expected: { integer1: 4 },
  },
  {
    name: "string -> integer (truncated)",
    input: { integer1: "4.999" },
    expected: { integer1: 4 },
  },
];

const booleanTests: TestCase[] = [
  {
    name: "===== BOOLEAN: boolean -> boolean",
    input: { boolean1: true },
    expected: { boolean1: true },
  },
  {
    name: "1 -> boolean",
    input: { boolean1: 1 },
    expected: { boolean1: true },
  },
  {
    name: "0 -> boolean FALSE",
    input: { boolean1: 0 },
    expected: { boolean1: false },
  },
  {
    name: "'TRUE' -> boolean",
    input: { boolean1: "TRUE" },
    expected: { boolean1: true },
  },
  {
    name: "'True' -> boolean",
    input: { boolean1: "True" },
    expected: { boolean1: true },
  },
  {
    name: "'true' -> boolean",
    input: { boolean1: "true" },
    expected: { boolean1: true },
  },
  {
    name: "'1' -> boolean",
    input: { boolean1: "1" },
    expected: { boolean1: true },
  },
  {
    name: "'FALSE' -> boolean FALSE",
    input: { boolean1: "FALSE" },
    expected: { boolean1: false },
  },
  {
    name: "'0' -> boolean FALSE",
    input: { boolean1: "0" },
    expected: { boolean1: false },
  },
  {
    name: "===== NOTICE THESE INVALID BOOLEANS: 'YES' -> invalid boolean",
    input: { boolean1: "YES" },
    expected: false,
  },
  {
    name: "NO -> invalid boolean",
    input: { boolean1: "NO" },
    expected: false,
  },
  {
    name: "null -> invalid  boolean",
    input: { boolean1: null },
    expected: false,
  },
  {
    name: "10 -> invalid  boolean",
    input: { boolean1: 10 },
    expected: false,
  },
  {
    name: "-1 -> invalid  boolean",
    input: { boolean1: -1 },
    expected: false,
  },
];

const testDate = new Date("2001-02-03T04:05:00.000Z"); // without the Z, it's local time
const zuluTestDate = new Date("2001-02-03T00:00:00.000Z"); // TODO maybe use Date.UTC instead

const builtinDateTypeTests: TestCase[] = [
  {
    name: "===== BUILT IN DATE TYPE: Date -> Date",
    input: { date1: testDate },
    expected: { date1: testDate },
  },
  {
    name: "'2001-02-03T04:05:00.000Z' -> '2001-02-03T04:05:00.000Z",
    input: { date1: "2001-02-03T04:05:00.000Z" },
    expected: { date1: testDate },
  },
  {
    name: "'2001-02-03' -> '2001-02-03 ZULUIZED",
    input: { date1: "2001-02-03" },
    expected: { date1: zuluTestDate },
  },
  {
    name: "'February 3, 2001' -> INVALID",
    input: { date1: "February 3, 2001" },
    expected: false,
  },
  {
    name: "'Harry Truman' -> INVALID",
    input: { date1: "Harry Truman" },
    expected: false,
  },
];

const dateStringTests: TestCase[] = [
  {
    name: "===== STRING DATE TYPE NEEDS HELP: '2001-02-03 -> INVALID!!?",
    input: { dateString: "2001-02-03" },
    // expected: { dateString: "2001-02-03" },
    expected: false,
  },
];

describe("Decoding Param Types", () => {
  for (
    const { name, input, expected } of [
      ...numbersTests,
      ...integersTests,
      ...booleanTests,
      // ...builtinDateTypeTests,
      // ...dateStringTests,
      // ...customDateTests, TOO unintuitive with timezones
    ]
  ) {
    it(name, () => {
      const parsed = Value.Convert(typeNeedingConversions, input);

      if (expected !== false) {
        assertEquals(
          parsed,
          expected,
          "expected converted (coerced) value to match expected",
        );
        assertEquals(
          Value.Check(typeNeedingConversions, parsed),
          true,
          "expected type to validate",
        );
      } else {
        assertEquals(
          Value.Check(typeNeedingConversions, parsed),
          false,
          "expected type to NOT validate",
        );
      }
    });
  }
});

// describe("Value.TransformTypes", () => {
//   it("remembers some things about dates", () => {
//     const dateFromString = new Date("2001-02-03"); // puts out UTC
//     const dateFromNumbers = new Date(2001, 2, 3); // UTC adjusted for locale
//     const dateFromUTCNumbers = new Date(Date.UTC(2001, 2, 3));
//     assertEquals(dateFromNumbers, dateFromUTCNumbers);
//   });
// });

describe("typebox dates", () => {
  const dateString = "2001-02-03";
  const dateSchema = Type.String({ format: "date" });
  const stringSchema = Type.String();
  initializeTypebox();

  it("validates as a string", () => {
    assert(Value.Check(stringSchema, dateString));
  });

  it("validates as a date", () => {
    assertEquals(Array.from(Value.Errors(dateSchema, dateString)), []);
    assertEquals(Value.Check(dateSchema, dateString), true);
  });

  it("tolerates re-registration", () => {
    initializeTypebox();
    initializeTypebox();
    assertEquals(Array.from(Value.Errors(dateSchema, dateString)), []);
    assertEquals(Value.Check(dateSchema, dateString), true);
  });

  it("rejects an invalid date", () => {
    assertEquals(Value.Check(dateSchema, "20000-11"), false);
  });
});
