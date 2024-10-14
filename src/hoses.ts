// cheap pipes

export type ValueOrPromise<B> = B | Promise<B>;
export type PossibleError = number | string | string[] | Error;
export type Haltable<B> = [B] | [B, PossibleError];

/**
 * Hose part
 */
export type HoseFn<C> = (context: C) => C | Promise<C>;
export type Hose<C> = (context: C) => Promise<C>;

/**
 * Given a pipeline and if true halts
 */
export type HaltCheck<C> = (context: C) => boolean;

/**
 * hose creates a function that pipes a context value throughan array of
 * functions sequentially to a context.
 *
 * This is a simplistic pipe function. It expects each function to output the
 * same sort of context as input or a promse that resolves to such a structure.
 *
 *   (A) => A | Promise<A>
 *
 * The only fanciness is it handles async easily.
 *
 * The rest is roll-your-own, but the design makes some provisions. If you need
 * to exit, throw an exception and handle it (or not), or pass in a haltIf
 * function that will observe context and be true if the rest of the functions
 * should bypass.
 *
 * Purity is by convention. If you want to use the context as an accumulator, a
 * floating garbage can, if you will. If you want to enforce purity, freeze each
 * context before returning it or use an immutability library. Or take a look at
 * RxJs or Effect or something.
 *
 * @param pipes
 * @param haltIf
 * @returns
 */
export function hose<C>(
  pipes: HoseFn<C>[],
  haltIf?: HaltCheck<C>,
): Hose<C> {
  return async (context: C) => {
    let result = context;
    haltIf ||= () => false; // default to never halting
    for (let i = 0; i < pipes.length; i++) {
      if (haltIf(result)) break;
      const fn = pipes[i];
      result = await fn(result);
    }
    return result;
  };
}
