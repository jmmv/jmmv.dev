# Build Meetup - Oct 2024

There is a FUSE-based tmpfs that fixes accounting issues within containers.

## RPM management

bazeldnf: converts RPMs to tars and can squash mulitiple of them into one tar.

rpm workspace rule, and then rpmtree rule to create an action to stage the RPMs. tar2files rule allows extracting portions of the tar, without extracting everything.

`$ORIGIN` in the `LD_LIBRARY_PATH` of files.

`rules_patchelf`.

## Compute the target graph of a big monorepo (Uber)

Bazel is very "unidirectional": deps is cheap, rdeps is not.

Modifying one source file does not have an impact on the build graph, but the build graph has to be recomputed if Bazel is restarted.

Monorepo analysis: 71% of changes only change source files; 15% change at least one BUILD file; 0.6% changed at least 10 BUILD files, and 0.7% changed at least one bzl file. Majority of changes do not modify the build graph structure, and those that do modify it very little.

Keep CI machines, and even then, it's 5 minutes to compute affected targets. With the new solution, it's 75 seconds.

Q: Why not "bazel test ..."? Because you probably don't have Bazel running.

## Flaky test detection

Internal service: Testopedia to find flaky tests. Record history of the tests and analyze the history to determine flakiness. Most granular entity in the hierarchy is the parameterized test in Java or subtest in Go (not Bazel test targets).

Go requires `--test_arg=-test.v` to produce the right granularity in the `junit.xml` that the test produces.

If there is a timeout, the test runner is killed so you don't get to see anything in the `junit.xml` file.

With this, we were able to run 3500 more tests in total, because we didn't skip them due to those belonging to problematic test suites or targets.

# Unconference

## Non-blocking queries

People want to do work with Bazel while the IDE is running, but the IDE also runs queries. Need to have multiple output bases. The requirement / desired feature is to have the IDE do operations separately from the user.

Google has a bunch of tools that do basic parsing to deal with this problem.
But we need access to code generated files, which Bazel produces.

Parallel builds with one output base.

But Skyframe is a parallel evaluator. Designed to have a single entry in the cache. When you start a build, Bazel invalidates everything (evicts) that depends on modified files. Unfortunately, there is other mutable state outside of Skyframe.

Query flags form the IDE may not match the command line. Discarded analysis cache.

The EventBus is per-invocation, so it wouldn't be a problem.

stdout of actions is not replayed in incremental builds. There is a flag to do it (maybe).

This is theoretically possible but it's a lot of work.

Implementing a depserver, but it's hard and using Bazel is slow. Would need to have a separate Starlark parser. The original implementation of this at Google years ago actually did run `bazel query` at the package level.

Cider runs the aspect using "remote Bazel", so it doesn't conflict with the local builds.

## Gradual rollout of library updates

Problem statement: one version policy. But we have to upgrade libraries, and the upgrades can be breaking.

One approach: "break the world".

Another approach: get exception from the one version policy. Use aliases in the build files to point to the old version. Start upgrading slowly, and once you are mostly there, flip the alias.

Need:
- Ability to run all tests is critical.
- Ability to modify the build files (buildifier).

Diamond dependencies can be a problem. Work on the subgraph independently.

Another option: create a parallel build and test infrastructure. Duplicate targets, rename them. Run those in CI until they pass (maybe less frequently). Structure code so that we can flip the version with a "3-line commit".

Add problematic targets to an exclusion list so that CI passes, and then treat this as the burndown list.

"Project files" to define this new set of targets and automatically set the right flags for them. Like Buck's PACKAGE. The design is not public but it could be. `project.scl` is the name for these files.

In Java, it's common to rename the package (JUnit 4 vs. 5) so that they don't conflict. But... people make breaking changes without realizing it, so semantic versioning is not always accurate.

## Missing tooling around Bazel

Scripting language for use in genrules (no shell & Windows batch files). What about WASM? Or Starlark with file system access? E.g. "transform JSON: read some file and produce another file in the genrule".

Target determination: given a set of files, determine affected targets. bazel-diff is slightly similar. We can use rdeps in a query, but it is not "trivial". But query doesn't always work: if you modify a toolchain, you won't see the impact (but it does show up in cquery).

Build queuing: this might exist in some CI systems already.

Unifying bazelisk with bazel? Users are confused with the fact that `sudo apt install bazel` is available.

buildozer for bzl files. E.g. clean up old repository rules that aren't referenced.

Java library for programmatically editing BUILD and bzl files. The current Starlark library wouldn't be useful here because it doesn't preserve the original file structure. The AST can be extracted from Python; the files are syntactically Python-valid.

Introspecting what Bazel is doing when it runs a query because there might be bugs. If it's reproducible, file a bug, but it's hard to reproduce in a small sample. If it's possible to extract a trace or something, it'd be useful.

Introspecting why Bazel isn't scheduling an action: is it waiting for local resources? Or?

Documentation website for all the rules. The BCR doesn't have links to documentation right now.

## Open-source CI runners (GitLab & GitHub). Caching of the analysis phase.

Downloading repo cache, populating the disk cache, etc. is very painful when you start onboarding onto Bazel: affects CI runners. Answer is "to not use ephemeral runners" but that's not always possible (security may not like it).

See talk from yesterday on caching the analysis cache on disk / remote cache.

Stateful set in the runners in Kubernetes to prevent throwing away the disk cache after auto-scaling the pools.

## bzlmod upgrade and pain points: custom registry, upgrading rulesets, vendoring.

Use remote downloader configuration to repoint downloads to a pull-through cache.

What about "internal" artifacts? "I purchase a binary blob and want to consume it via bzlmod". You can layer multiple registries. You can also override the archives.

You don't have to have BCR configured at all. You can also vendored sources with `bazel vendor ...`.

Not in bzlmod yet: googleapis, grpc, rules_scala (in progress). For grpc, can we avoid not having to pull in all languages in the rules? Maybe, trying to fix these issues.

## Sandboxing strategies

Lack of a hardlinked sandbox. There are many libraries in RoR that don't handle symlinks well. Was relying on sandboxfs before, but support is gone.

There is a report about sandboxing strategies in the discussion threads (published yesterday).

There are different scenarios for sandboxing. Trusted rules may not need it. But is sandboxing to get hermetic builds? To secure the host?

Some toolchains need to store state "on the side" to speed up subsequent builds, but sandboxing kills this benefits and it feels as if sandboxing is very slow. Common issue with ObjC and Swift on macOS.

Instead of sandboxing, it's also possible to monitor the build for file accesses and then fail the build if the actions accessed things they aren't supposed to access. Landlock API on Linux. BuildXL on Windows was (is?) also doing this. This is problematic for certain tools, like the JavaScript tooling because it does an "internal glob" and decides what to do based on what they see.

Surprising that sandboxing does not hide system headers by default (the new hermetic? strict? sandbox for Linux should fix it). Also, the semantics of RE vs. local sandboxing is very different.

It may be interesting to separate the sandboxing logic into its own thing that Bazel talks to, instead of having this built into the code.

Has anyone tried to do "local remote execution"? The overhead might be too high, but it's another way to get sandboxing. Can be useful for crosscompilation for environments that don't really support it. There is the Docker strategy, but it's not exactly this because it uses Docker local paths.

## git performance, sparse checkouts, monorepo

Bazel and big repos go hand in hand, and git isn't great.

fs monitor, untracked cache, keeping gitignore small, sparse checkouts.

Previous attempt from Uber: Run a bazel query (where? could be a query service, but then local vs. remote state inconsistencies) to find the files that need to be materialized for a build, and then give those files to git for the actual build. Confusing error messages.

Feature request to delegate file accesses to another tool: <https://github.com/bazelbuild/bazel/issues/16380> Sounds like "fuse" but this would work on macOS well. Could use NFS on Mac (like edenfs does at Meta, or what Buildbarn provides for bb-clientd).

git is a very chatty protocol. Perforce can easily saturate the network, but git on the same repo cannot. git-archive seems to offer the necessary performance because it bypasses the git protocol altogether. Talk to Mark Zeren for an idea on a service that could help here.

CI systems to prepopulate a git-archive routinely and use that from clients to at least bypass the cost of the initial fetch. Can also help if you are pulling many individual git repos.

A git shallow clone over the loopback interface is much slower than a cached git archive.

## Depending on test outputs / artifacts. Depending on test status to prevent costly builds

If you run the tests in the build, is the environment "compatible" with the test environment? `TEST_TMPDIR` and the like. No, need to reimplement these features as necessary.

You may have a really long integration test and you might want to first run the unit tests and only start the integration test if those pass. Does this belong in Bazel, or should this be in a separate wrapper script? The build graph already expresses dependencies across code components, so why shouldn't it also represent dependencies across tests? One option is to run tests by size, in stages, but this adds latency to the whole run.

After onboarding various projects onto Bazel that had separate test stages, the approach that seems to work best is to start everything at once.

There is `--test_keep_going` which can be set to false to stop the build at the first failure.

The longest-running test should start sooner to reduce latency. This impacts p99 of all builds because test scheduling is "random". "Profile-guided test or build action scheduling" -- (Jin) has been looked at, but not really.

For really large test targets, set `shard_count`. Does not help if one of the individual test cases is the long pole. And this also can add overhead if the test target has some common costly setup.

Once we have async action execution, we will be able to handle local scheduling better. Will be able to track resources without having to "start" the actions and then having them block when they cannot acquire resources.

Can we have a "post-test action" that the user controls, to e.g. trigger coverage? Could be easily implemented, but let's not do aspects over tests (problems with configurations).

Bazel sends SIGTERM to tests that timeout. Sometimes, the test runner wants to do some extra post-processing to generate logs and the like but that terminates early.

Bazel generates three actions per test target: the test itself, another action to generate the junit.xml file if it wasn't produced, and another one to do coverage post-processing. We could add one more. There are also retries, and sharding, and `runs_per_test`.

##  5 Distroless / rules_oci.
##  5 Windows.
##  5 Telemetry.
##  1 Slowliness of runfiles. Manifest is the bottleneck.
## Bazel learning curve
