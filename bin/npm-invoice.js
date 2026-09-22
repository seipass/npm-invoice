#!/usr/bin/env node

import { analyzePackage } from '../src/analyze.js';
import { RegistryClient } from '../src/registry.js';
import { renderInvoice } from '../src/render.js';
import { parsePackageSpec } from '../src/spec.js';

const VERSION = '0.1.0';

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }
  if (options.version) {
    console.log(VERSION);
    return;
  }
  if (!options.package) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const spec = parsePackageSpec(options.package);
  const client = new RegistryClient({ registry: options.registry });
  let lastCount = 0;

  const report = await analyzePackage(spec, {
    client,
    staleDays: options.staleDays,
    maxPackages: options.maxPackages,
    onProgress(count) {
      lastCount = count;
      if (!options.json && process.stderr.isTTY) {
        process.stderr.write(`\rScanning dependency graph… ${count} packages`);
      }
    }
  });

  if (!options.json && process.stderr.isTTY && lastCount > 0) {
    process.stderr.write('\r\u001b[2K');
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderInvoice(report, {
      color: options.color && process.stdout.isTTY
    }));
  }
}

function parseArgs(args) {
  const options = {
    package: null,
    json: false,
    color: !process.env.NO_COLOR,
    help: false,
    version: false,
    staleDays: 730,
    maxPackages: 5000,
    registry: process.env.npm_config_registry || 'https://registry.npmjs.org'
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--no-color') options.color = false;
    else if (arg === '--stale-days') options.staleDays = positiveInteger(args[++index], '--stale-days');
    else if (arg === '--max-packages') options.maxPackages = positiveInteger(args[++index], '--max-packages');
    else if (arg === '--registry') options.registry = requiredValue(args[++index], '--registry');
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (!options.package) options.package = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

function positiveInteger(value, flag) {
  const number = Number.parseInt(requiredValue(value, flag), 10);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return number;
}

function requiredValue(value, flag) {
  if (!value || value.startsWith('-')) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`npm-invoice ${VERSION}\n\nSee the real dependency bill before you install an npm package.\n\nUsage:\n  npm-invoice <package[@version]> [options]\n\nExamples:\n  npm-invoice express\n  npm-invoice react@19\n  npm-invoice @scope/package@latest\n\nOptions:\n  --json                 Print machine-readable JSON\n  --stale-days <days>    Inactivity threshold (default: 730)\n  --max-packages <count> Safety limit (default: 5000)\n  --registry <url>       npm registry URL\n  --no-color             Disable ANSI colors\n  -h, --help             Show help\n  -v, --version          Show version`);
}

main().catch((error) => {
  if (process.stderr.isTTY) process.stderr.write('\r\u001b[2K');
  console.error(`npm-invoice: ${error.message}`);
  process.exitCode = 1;
});
