/**
 * Parsed Args
 */
interface Pargs<F> {
  args: string[]; // positional args
  dashdash?: string[]; // args after --
  flags: F;
}

/**
 * Single commands and multi-commands both present this functional interface.
 * Implementations may compose them from different data structures
 * And add methods to build the command. A checker can be added for tests
 * to walk the tree and check for discrepancies, I don't think we
 * make flags hierarchical we could easily switch it I suppose.
 */
export interface Command<Flags> {
  slug: () => string;
  description: () => string;
  help: () => string;
  parse: (args: string[]) => Pargs<Flags>;
  execute: (args: Pargs<Flags>) => Promise<number>; // exit status

  // utility mothods
  flagNames: () => string[]; // for sanity checks
  // deno-lint-ignore no-explicit-any
  subcommands: () => Command<any>[]; // to walk tree for sanity checks
}

// deno-lint-ignore no-explicit-any
export async function run<T>(cmd: Command<T>, args: string[]) {
  try {
    const pargs = cmd.parse(args);
    const exitCode = await cmd.execute(pargs);
    // warn if exit code? No function should except
    return exitCode;
  } catch (err) {
    console.error(err.message);
  }
}
