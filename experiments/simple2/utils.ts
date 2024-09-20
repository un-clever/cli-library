// import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
// import  types { Flag, FlagParser } from "./types.ts";

// export function makeFlag<T>(
//   name: string,
//   parser: FlagParser<T>,
//   required = false,
// ): Flag<T> {
//   return {
//     name,
//     description: `your argument named ${name}`,
//     parser,
//     required,
//     // default: undefined,
//   };
// }
// /**
//  * A simple FlagSpec that could drive a parser
//  */

// export const flagset1Dynamic = {
//   one: makeFlag<string>("one", stringFlag),
//   dos: makeFlag<string>("dos", stringFlag, true),
//   three: makeFlag<boolean>("three", booleanFlag),
//   four: makeFlag<number>("four", floatFlag),
//   cinco: makeFlag<number>("cinco", intFlag, true),
// };
