/**
 * CLI programs have to interact with the console often
 * and nice ones pipe correctly. But cross-platform stdout and stderr
 * is still in flux.
 *
 * We sidestep it for now. Maybe.
 */

/**
 * Writer is copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface Writer {
  write(p: Uint8Array): Promise<number>;
}

/**
 * Printer is like writer but has a built in encoder.
 */
export interface Printer {
  print(msg: string): Promise<number>;
}

export function writerToPrinter(w: Writer): Printer {
  const encoder = new TextEncoder();
  return {
    print(msg: string) {
      return w.write(encoder.encode(msg));
    },
  };
}

/**
 * WriterSync is copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface WriterSync {
  writeSync(p: Uint8Array): number;
}

/**
 * writerSyncToPrinter "async-ifies" a synchronous output because, since we
 * don't know where output may be sent to, better to encourage async code when
 * dealing with it
 * @param w
 * @returns
 */
export function writerSyncToPrinter(w: WriterSync): Printer {
  const encoder = new TextEncoder();
  return {
    print(msg: string) {
      return Promise.resolve(w.writeSync(encoder.encode(msg)));
    },
  };
}

// SYNCHRONOUS OUTPUT
// I'm hesitant to add this until we know we can deal with it
// /**
//  * PrinterSync is like WriterSync but has a built in encoder
//  */
// export interface PrinterSync {
//   printSync(msg: string): void;
// }

// export function makePrinterSync(w: WriterSync): PrinterSync {
//   const encoder = new TextEncoder();
//   return {
//     printSync(msg: string) {
//       return w.writeSync(encoder.encode(msg));
//     },
//   };
// }

/**
 * Closer is copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface Closer {
  close(): void;
}

export function isCloser(w: unknown): w is Closer {
  const c = w as Closer;
  return typeof c?.close === "function";
}

export function closeIfCloser(w: Writer | WriterSync | Printer): void {
  if (isCloser(w)) w.close();
}
