# Changelog

## 0.2.0 - 2017-10-30

Added some more tests for multiple communication with the underlying process.

It is stable enough for use so upgrading the minor version, to allow me to work on some minor improvements before upgrading major version.

## 0.1.4 - 2017-10-29

The first fully correct implementation. Covered with unit tests.

## <= 0.1.3

**BROKEN**

Do not use any of these versions. The package had 2 mistakes with wrong streams being used in ```spawnLineByLine``` but seemed to be working by coincidence. The example test I used was an echo program, and the combination of the mistakes was simulating an echo program.

Yes, bad luck!

These versions are **deprecated** so if you use any of them please upgrade.
