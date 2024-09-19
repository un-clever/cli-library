import { assertEquals, describe, it } from "testlib";
import type { Pargs, PargsResult, PartialPargsResult } from "./commands.ts";
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
  failure: undefined,
};

function getPartialParseStart<F>(args: string[]): PartialPargsResult<F> {
  return {
    value: { args: [], flags: {}, dashdash: [] },
    tail: args,
  };
}

function markComplete<F>(partial: PartialPargsResult<F>): PargsResult<F> {
  // if it's errored, just undefine value
  // fill in defaults
  // check required
  // error if necessary and leave value undefined
  return partial as PargsResult<F>;
}

// function trialParser1<F>(
//   _flagspec: FlagSpec<F>,
//   _args: string[],
// ): PargsResult<F> {
//   const {value} = getPartialParseStart<F>(_args);

//   // core loop
//   try {
//     while (parsing.tail.length > 0) {
//       parsing.tail.pop();
//     }
//     parsing.value && parsing.value.flags["one"] = "a";
//     return markComplete(parsing);
//   } catch (err) {
//     parsing.failure = err;
//     parsing.value = undefined;
//     return markComplete(parsing);
//   }

// recast (or validate) and return
// const finalize
// const flags = pflags as F;
// const result = {
//   ...pargsResult,
//   value: { args, flags, dashdash },
//   tail,
//   failure,
//   advice,
// };
// return result;
// }

describe("trialParser 1", () => {
  // it("parses", () => {
  //   const results = trialParser1(simpleFlags1, []);
  //   assertEquals(results, pargsResult);
  // });
});
