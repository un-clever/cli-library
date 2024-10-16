import type { StandardOutputs, Writer } from "./types.ts";
/**
 * copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface Writer {
  write(p: Uint8Array): Promise<number>;
}

/**
 * OutsFn ("Out String Function") is any async command that can take a string
 * and output it somewhere, typically stdout.
 */

/**
 * StandardOutputs abstracts CLI output and piping, sidestepping inconsistencies
 * in STDIO among runtimes
 *
 * CLI's have to interact with terminals and piping. Splitting program output
 * from error output solves [The
 * Semi-PredicateProblem](https://en.wikipedia.org/wiki/Semipredicate_problem)
 * in an elegant and standard way. See also the [Wikipedia entry on Standard
 * Streams](https://en.wikipedia.org/wiki/Standard_streams), especially the
 * section for Standard Error.
 *
 * Yet runtimes, OS's, and compiled libraries are notorious for inconsistent
 * handling of these. Injecting this simple structure into each command tries to
 * sidestep most of those inconsistencies and encourage (or at least not
 * discourage) best practices.
 */
export type StandardOutputs = {
  /**
   * outs: "output String" writes a string to an app's main output stream
   */
  outs: OutsFn;
  /**
   * errs: "error String" writes a string to an app's error stream
   */
  errs: OutsFn;
};

export function standardizeOutputs(
  outputStream: Writer,
  errorStream: Writer,
): StandardOutputs {
  const encoder = new TextEncoder();

  async function writeAllString(w: Writer, s: string): Promise<void> { // derived from @std/io/write-all
    const data = encoder.encode(s);
    let n = 0;
    while (n < data.length) n += await w.write(data.subarray(n));
  }
  return {
    outs: (s: string) => writeAllString(outputStream, s),
    errs: (s: string) => writeAllString(errorStream, s),
  };
}
