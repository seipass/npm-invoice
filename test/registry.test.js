import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVersion } from '../src/registry.js';
import { formatBytes } from '../src/render.js';

const packument = {
  'dist-tags': { latest: '2.1.0', next: '3.0.0-beta.1' },
  versions: {
    '1.0.0': {},
    '1.5.0': {},
    '2.0.0': {},
    '2.1.0': {},
    '3.0.0-beta.1': {}
  }
};

test('resolves exact versions, tags, and semver ranges', () => {
  assert.equal(resolveVersion(packument, '1.0.0'), '1.0.0');
  assert.equal(resolveVersion(packument, 'latest'), '2.1.0');
  assert.equal(resolveVersion(packument, '^1.0.0'), '1.5.0');
  assert.equal(resolveVersion(packument, '^2.0.0'), '2.1.0');
});

test('does not select prereleases for ordinary ranges', () => {
  assert.equal(resolveVersion(packument, '>=1'), '2.1.0');
});

test('formats byte totals for the invoice', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(10 * 1024 * 1024), '10.0 MB');
});
