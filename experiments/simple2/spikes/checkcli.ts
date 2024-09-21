// test the Deno/Shell Arg parser manually

/**
 * Examples:
 *
 * deno run checkcli.ts one two three "this is a quoted string" "-this also is a quoted string"
 *   [
 *     "one",
 *     "two",
 *     "three",
 *     "this is a quoted string",
 *     "-this also is a quoted string"
 *   ]
 */

console.log(JSON.stringify(Deno.args, null, 2));
