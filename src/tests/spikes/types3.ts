// pipeline look at cli

import type { StandardOutputs } from "../../types.ts";
import type {
  Args,
  Command,
  LeafCommand,
  MultiCommand,
  Status,
  SubcommandPath,
} from "./types1.ts";

interface MMTSContext {
  std: StandardOutputs;
  root: Command; // might be a single or multi
  commandPath: SubcommandPath;
  args: Args;
  argPos: number;
}

export function maybeMultiToSinglePipeline(
  _ctx: MMTSContext,
  _args: string[],
): MMTSContext {
  // descend gathering commandPath
  // until: error, help, or leaf
  return {} as MMTSContext;
}

// basically, add the typed stuff
interface runLeafCtx<VV> extends MMTSContext {
  command: LeafCommand<VV>;
  flagsP: Partial<VV>;
  flags?: VV;
}

export function runLeafPipeline<VV>(): Status {
  // if help exitHelp()
  // parse flags
  // enrich flags
  // validate flags (running pre-run on flags)
  // validate positional args (maybe run pre-run on flags, args)
  // run the command
  // handle errors
  return Promise.resolve(0);
}

// functions in the pipe can be sync or async
export type pipeableAtoA<A> = (a: A) => A | Promise<A>;

// but the returned pipe is always async
export type pipeAtoA<A> = (a: A) => Promise<A>;

/**
 * Various implementations These all benchmark very similar with async
 * functions.
 *
 * This version explores some ideas:
 * 1. Typing the pipe function becomes much simpler if it always spits out the
 *    same type it expects.
 * 2. It's not too hard to make it deal with Promises then too, so the functions
 *    of the pipe can be sync or async.
 * 3. I hunch that a purely sync pipeline would be faster without the async
 *    wrapper, but it's worth testing.
 *
 * Reduce and For implementations seem about the same speed on Deno.
 *
 * I like Effect, but don't want it for dependency-free libs. How to handle
 * errors, then? I suggest a couple methods.
 * 1. Catch otherwise uncaught Exceptions at the top level; these are fatal
 *    dies.
 * 2. Split longer pipelines into multiple based on error handling needs and use
 *    some combination of the following.
 * 3. Make the type (A) a mutable context that can have one or more stop
 *    conditions, which, if set, later operations will exit early on.
 * 4. Make a special exception for early exit that passes back the context in a
 *    particular state.
 * 5. Just throw an exception and deal with it. Exceptions, are, after all, not
 *    just for errors.
 * 6. make a slightly more complicated version of this with a second optional
 *    param, maybe an error, maybe, number, maybe string array. If it's not
 *    undefined, exit fast from later functions. A for loop will do this better
 *    than a loop.
 *
 * @param pipes
 * @returns
 */
export function pipeAtoA<A>(...pipes: pipeableAtoA<A>[]): pipeAtoA<A> {
  return async (a: A) => {
    let result = a;
    for (let i = 0; i < pipes.length; i++) {
      const fn = pipes[i];
      const b = fn(result);
      // if (b instanceof Promise) result = await b;
      // else result = b;
      result = await b;
    }
    return result;
  };
}

export function pipeFor2<A>(...pipes: pipeableAtoA<A>[]): pipeAtoA<A> {
  return async (a: A) => {
    let result = a;
    for (let i = 0; i < pipes.length; i++) {
      // const fn = pipes[i];
      result = await pipes[i](result);
    }
    return result;
  };
}

export function pipeReducer<A>(...pipes: pipeableAtoA<A>[]): pipeAtoA<A> {
  const r: pipeableAtoA<A> = pipes.reduce(
    (fn1, fn2) => // given a function and the next function which is to wrap it
    async (a: A) => { // return a function that takes an A
      const a1 = await fn1(a);
      return fn2(a1);
    },
    (a: A) => a,
  );
  return r as pipeAtoA<A>;
}

export function pipeReducer2<A>(...pipes: pipeableAtoA<A>[]): pipeAtoA<A> {
  const r: pipeableAtoA<A> = pipes.reduce(
    (fn1, fn2) => // given a function and the next function which is to wrap it
    async (a: A) => { // return a function that takes an A
      return fn2(await fn1(a));
    },
    (a: A) => a, // without the initial value the reducer fails if there are no pipes
  );
  return r as pipeAtoA<A>;
}

export type ValueOrPromise<B> = B | Promise<B>;
// export type PossibleError = number; // 0 means no error, anything else means skip the rest of the pipeline and use B and the number to decide actions.
export type PossibleError = number | string | string[] | Error;
export type Haltable<B> = [B] | [B, PossibleError];

export type PipeableBtoB<B> = (
  b: B,
) => ValueOrPromise<Haltable<B>>;

export type PipeBtoB<B> = (b: B) => Promise<Haltable<B>>;

/**
 * This version experiments with passing along an error value to short circuit
 * the pipeline. It means wrapping every return in an array, but if there's no
 * error, it's just the value, and if there is, it's [value, PossibleError]
 * which can one of several types to suit different tasks.
 *
 * This probably needs more testing
 *
 * @param pipes
 * @returns
 */
export function pipeBtoB<B>(...pipes: PipeableBtoB<B>[]): PipeBtoB<B> {
  const retFn: PipeBtoB<B> = async (a: B) => {
    let result = a;
    for (let i = 0; i < pipes.length; i++) {
      const fn = pipes[i];
      const c = await fn(result);
      if (c[1] !== undefined) return c;
      result = c[0];
    }
    return [result];
  };
  return retFn;
}

/**
 * Utility to turn an AtoA style fn to to a BtoB (haltable) type
 * @param fn
 * @returns
 */
export function haltify<B>(fn: pipeableAtoA<B>): PipeBtoB<B> {
  return async (b: B) => {
    const c = await fn(b);
    return [c];
  };
}
