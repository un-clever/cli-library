# Checking Deno Doc Tests

Hey, this is exciting, Deno 2.0 has improved Doc tests. It's especially cool that they'll even let me test my README's.

```ts
import {assertEquals, assertThrows} from "@std/assert";
const a = 1;
const b = 2;
assertEquals(a, 1);
assertEquals(b, 2);
assertThrows(() => {throw new Error("just checking")});

// uncommenting the line below should convince you the code
// is really being run
// assertThrows(() => 1);
```

I like the idea of putting multiple code block to intersperse tested examples with prose documentation.

```ts
import {assertEquals, assertThrows} from "@std/assert";
const a = 1;
const b = 2;
assertEquals(a, 1);
assertEquals(b, 2);
assertThrows(() => {throw new Error("just checking")});
```

But what happens if there's async?

```ts
import {describe,it} from "@std/testing/bdd";
import {assertEquals, assertThrows} from "@std/assert";

async function asyncNumber(n: number): Promise<number> {
  return Promise.resolve(n)
}

assertEquals(2,2);

const asyncresult = await asyncNumber(3);

assertEquals(asyncresult, 3);

```
But what happens if there's async again?

```ts
import {assertEquals, assertThrows} from "@std/assert";

async function asyncNumber(n: number): Promise<number> {
  return Promise.resolve(n)
}

assertEquals(2,2);

const asyncresult = await asyncNumber(4);

assertEquals(asyncresult, 4);

```