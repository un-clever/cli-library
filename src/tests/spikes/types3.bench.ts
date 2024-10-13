import { banana, strRev, strUC } from "./types3.test.ts";
import { pipeAtoA, pipeFor2, pipeReducer, pipeReducer2 } from "./types3.ts";

const pipes = [
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
  strRev,
  strUC,
  banana,
  strRev,
];
const forPiper = pipeAtoA(...pipes);
const forPiper2 = pipeFor2(...pipes);
const redPiper = pipeReducer(...pipes);
const redPiper2 = pipeReducer2(...pipes);

Deno.bench("hard-coded piper", async () => {
  // await strRev(banana(await strUC(await strRev("fred"))));
  await strRev(
    await strUC(
      banana(
        await strRev(
          await strRev(
            await strUC(
              banana(
                await strRev(
                  await strRev(
                    await strUC(
                      banana(
                        await strRev(
                          await strRev(
                            await strUC(
                              banana(
                                await strRev(
                                  await strRev(
                                    await strUC(
                                      banana(
                                        await strRev(
                                          await strRev(
                                            await strUC(
                                              banana(
                                                await strRev(
                                                  await strRev(
                                                    await strUC(
                                                      banana(
                                                        await strRev(
                                                          await strRev(
                                                            await strUC(
                                                              banana(
                                                                await strRev(
                                                                  await strRev(
                                                                    await strUC(
                                                                      banana(
                                                                        await strRev(
                                                                          await strRev(
                                                                            await strUC(
                                                                              banana(
                                                                                await strRev(
                                                                                  await strRev(
                                                                                    await strUC(
                                                                                      banana(
                                                                                        await strRev(
                                                                                          await strRev(
                                                                                            await strUC(
                                                                                              banana(
                                                                                                await strRev(
                                                                                                  await strRev(
                                                                                                    await strUC(
                                                                                                      banana(
                                                                                                        await strRev(
                                                                                                          "fred",
                                                                                                        ),
                                                                                                      ),
                                                                                                    ),
                                                                                                  ),
                                                                                                ),
                                                                                              ),
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      ),
                                                                                    ),
                                                                                  ),
                                                                                ),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
});

Deno.bench("for loop piper", async () => {
  await forPiper("fred");
});
Deno.bench("for loop 2 piper", async () => {
  await forPiper2("fred");
});

Deno.bench("reduce  piper", async () => {
  await redPiper("fred");
});
Deno.bench("reduce  piper 2", async () => {
  await redPiper2("fred");
});
