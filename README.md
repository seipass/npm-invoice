# npm-invoice

[![CI](https://github.com/seipass/npm-invoice/actions/workflows/ci.yml/badge.svg)](https://github.com/seipass/npm-invoice/actions/workflows/ci.yml)

**You asked for 1 package. You're getting 69.**

`npm-invoice` shows the dependency bill before you install an npm package. It reads registry metadata only: nothing is installed and no package scripts are executed.

```text
$ npx npm-invoice express

npm invoice
────────────────────────────────────────────────────
requested  express@latest
resolved   express@5.2.1

YOU ASKED FOR      1 package
YOU'RE GETTING     69 packages

DEPENDENCY BILL
────────────────────────────────────────────────────
Transitive packages         68
Unpacked size               2.06 MB
Files                       602
Install scripts             0
Deprecated packages         0
Inactive > 730d             14
Maximum depth               6
────────────────────────────────────────────────────
Peer dependencies are not included because they depend on the target project.
```

That example was produced by the CLI against the npm registry on September 22, 2026. Registry contents change, so current numbers may differ.

## Why

A one-line dependency can bring dozens or hundreds of packages, hundreds of files, install-time scripts, deprecated modules, and far more disk usage than the package name suggests.

`npm-invoice` turns that hidden cost into one small receipt.

## Usage

```sh
npx npm-invoice express
npx npm-invoice react@19
npx npm-invoice @types/node@22
```

For machine-readable output:

```sh
npx npm-invoice express --json
```

Other options:

```text
--stale-days <days>    Inactivity threshold (default: 730)
--max-packages <count> Safety limit (default: 5000)
--registry <url>       npm registry URL
--no-color             Disable terminal colors
```

## What is counted

- Unique resolved package versions in the dependency graph
- Total unpacked size reported by the npm registry
- Total files reported by package tarball metadata
- Packages with install-time scripts
- Deprecated package versions
- Packages whose registry metadata has not changed within the inactivity threshold
- Maximum dependency depth

Regular dependencies and optional dependencies are included. Peer dependencies are not added to the bill because their installation depends on the target project.

Local, Git, workspace, and direct URL dependency specs are skipped and shown as a partial-result warning.

## How it works

`npm-invoice` reads npm's abbreviated installation metadata, resolves version ranges, walks the dependency graph with bounded concurrency, deduplicates resolved package versions, and totals the registry-provided package metadata.

The inactivity number uses the registry's package-level `modified` timestamp. It is a quick maintenance signal, not the publish date of the exact resolved version.

## Development

```sh
npm install
npm test
node ./bin/npm-invoice.js express
```

Requires Node.js 20 or newer. CI runs the test suite and a live Express dependency-graph scan on Node.js 20, 22, and 24.

## License

MIT
