
20 Sep 2024: I'm working on a new, hopefully simpler, parser in /experiments/simple2.

  - I just finished typing the flags. Currently:
    - Type assertsions on OptionalFlag vs. RequiredFlag are flakey
    - BUT they help properly infer the allowable parsed results of a flagset
    - NOTING that optional props are inferreds a `prop: T | undefined`, not `prop?: T`, which is the same to the programmer, but not to the type assertions.
  - I also finished making and testing flag parser, little mini parsers to handle one flag type.
  - Next I could:
    - flesh out an args parser
    - see if I can fix Deno's @std/testing/types so that
      assertType<