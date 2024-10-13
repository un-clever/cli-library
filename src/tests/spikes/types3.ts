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
