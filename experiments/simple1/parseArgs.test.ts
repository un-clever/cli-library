import { assertEquals, describe, it } from "testlib";
import type { Pargs, PargsResult } from "./commands.ts";
import { makeFlag } from "./flags.test.ts";
import type { FlagSpec, FlagsType } from "./flags.ts";
import { stringFlag } from "./flagParsers.ts";

const simpleFlags1 = { one: makeFlag<string>("one", stringFlag) };
type SF1 = FlagsType<typeof simpleFlags1>;

const pargs: Pargs<SF1> = {
  args: [],
  flags: { one: "a" },
  dashdash: [],
};

const pargsResult: PargsResult<SF1> = {
  value: pargs,
  tail: [],
};

function trialParser1(
  _flagspec: FlagSpec<SF1>,
  _args: string[],
): PargsResult<SF1> {
  return pargsResult;
}

describe("trialParser 1", () => {
  it("parses", () => {
    const results = trialParser1(simpleFlags1, []);
    assertEquals(results, pargsResult);
  });
});
