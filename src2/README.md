# Rewrite for issue 34

The concept:

- Ditch command as a functional interface for
- Command and MultiCommand as structs that can be run
- MAYBE use a function pipeline to run them (but keep the brain debt low)
- MAYBE revise error and exception handling:
  - HELP and errors just bail the pipeline, after the pipeline we check for things needing special output?
  - More unique errors with fields to match the reporting and
  - Main messages drawn off a language file

RE-READ the root README.md before doing much more.