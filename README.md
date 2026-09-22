# npm-invoice

**You asked for one package. How many are you actually taking home?**

`npm-invoice` shows the dependency bill *before* you install an npm package.

```text
$ npx npm-invoice express

npm invoice
────────────────────────────────────────────────────
requested  express@latest
resolved   express@5.x.x

YOU ASKED FOR      1 package
YOU'RE GETTING     60+ packages

DEPENDENCY BILL
────────────────────────────────────────────────────
Transitive packages         ...
Unpacked size               ...
Files                       ...
Install scripts             ...
Deprecated packages         ...
Inactive > 730d             ...
Maximum depth               ...
────────────────────────────────────────────────────
Peer dependencies are not included because they depend on the target project.
```

The exact numbers come from the npm registry at runtime.

## Why

A one-line dependency can bring hundreds of packages, thousands of files, install-time scripts, deprecated modules, and a much larger disk footprint than the package name suggests.

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

Regular dependencies and optional dependencies are included. Peer dependencies are reported separately by npm because their actual installation depends on the target project, so they are not added to the bill yet.

Local, Git, workspace, and direct URL dependency specs are skipped and shown as a partial-result warning.

## How it works

`npm-invoice` reads npm's abbreviated installation metadata, resolves version ranges, walks the dependency graph with bounded concurrency, deduplicates resolved package versions, and totals the registry-provided package metadata. It does not install the package and does not execute package scripts.

## Development

```sh
npm install
npm test
node ./bin/npm-invoice.js express
```

Requires Node.js 20 or newer.

## License

MIT
